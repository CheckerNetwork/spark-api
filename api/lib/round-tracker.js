import assert from 'node:assert'

import { createMeridianContract } from './ie-contract.js'

export const TASKS_PER_ROUND = 500

/** @typedef {Awaited<ReturnType<import('./ie-contract.js').createMeridianContract>>} MeridianContract */

/**
 * @param {object} args
 * @param {import('pg').Pool} args.pgPool
 * @param {import('../../common/typings.js').RecordTelemetryFn} args.recordTelemetry
 * @param {AbortSignal} [args.signal]
 * @returns {Promise<{
 *  sparkRoundNumber: bigint;
 *  meridianContractAddress: string;
 *  meridianRoundIndex: bigint;
 *  roundStartEpoch: bigint;
 * }>}
 */
export async function startRoundTracker ({ pgPool, signal, recordTelemetry }) {
  const contract = await createMeridianContract()

  const onRoundStart = (newRoundIndex, ...args) => {
    /** @type {import('ethers').ContractEventPayload} */
    const event = args.pop()
    const blockNumber = event?.log?.blockNumber ? BigInt(event.log.blockNumber) : undefined
    if (blockNumber === undefined) {
      console.warn(
        'Ethers.js event data did not include ContractEventPayload with the block number. ' +
        'Will call `eth_getLogs` to find the round start epoch.'
      )
    }

    updateSparkRound(pgPool, contract, newRoundIndex, recordTelemetry, blockNumber).catch(err => {
      console.error('Cannot handle RoundStart:', err)
    })
  }
  contract.on('RoundStart', onRoundStart)
  if (signal) {
    signal.addEventListener('abort', () => {
      contract.removeListener('RoundStart', onRoundStart)
    })
  }

  const currentRound = await updateSparkRound(pgPool, contract, await contract.currentRoundIndex(), recordTelemetry)
  return currentRound
}

/**
 * @param {import('pg').Pool} pgPool
 * @param {MeridianContract} contract
 * @param {bigint} newRoundIndex
 * @param {import('../../common/typings.js').RecordTelemetryFn} recordTelemetry
 * @param {bigint} [roundStartEpoch]
 */
async function updateSparkRound (pgPool, contract, newRoundIndex, recordTelemetry, roundStartEpoch) {
  const meridianRoundIndex = BigInt(newRoundIndex)
  const meridianContractAddress = await contract.getAddress()

  if (roundStartEpoch === undefined) {
    roundStartEpoch = await getRoundStartEpochWithBackoff(contract, meridianRoundIndex)
  }

  const pgClient = await pgPool.connect()
  try {
    await pgClient.query('BEGIN')
    const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
      meridianContractAddress,
      meridianRoundIndex,
      roundStartEpoch,
      pgClient,
      recordTelemetry
    })
    await pgClient.query('COMMIT')
    console.log('SPARK round started: %s (epoch: %s)', sparkRoundNumber, roundStartEpoch)
    return {
      sparkRoundNumber,
      meridianContractAddress,
      meridianRoundIndex,
      roundStartEpoch
    }
  } catch (err) {
    await pgClient.query('ROLLBACK')
    throw err
  } finally {
    pgClient.release()
  }
}

/*
There are three cases we need to handle:

1. Business as usual - the IE contract advanced the round by one
2. Fresh start, e.g. a new spark-api instance is deployed, or we deploy this PR to an existing instance.
3. Upgrade of the IE contract

For each IE version (defined as the smart contract address), we are keeping track of three fields:
- `contractAddress`
- `sparkRoundOffset`
- `lastSparkRoundNumber`

Whenever a new IE round is started, we know the current IE round number (`meridianRoundIndex`)

Let me explain how are the different cases handled.

**Business as usual**

We want to map IE round number to SPARK round number. This assumes we have already initialised our
DB for the current IE contract version we are working with.

```
sparkRoundNumber = meridianRoundIndex + sparkRoundOffset
```

For example, if we observe IE round 123, then `sparkRoundOffset` is `-122` and we calculate the
spark round as `123 + (-122) = 1`.

We update the record for the current IE contract address
to set `last_spark_round_number = sparkRoundNumber`.

**Fresh start**

There is no record in our DB. We want to map the current IE round number to SPARK round 1. Also, we
want to setup `sparkRoundOffset` so that the algorithm above produces correct SPARK round numbers.

```
sparkRoundNumber = 1
sparkRoundOffset = sparkRoundNumber - meridianRoundIndex
```

We insert a new record to our DB with the address of the current IE contract, `sparkRoundOffset`,
and `last_spark_round_number = sparkRoundNumber`.

**Upgrading IE contract**

We have one or more existing records in our DB. We know what is the last SPARK round that we
calculated from the previous version of the IE contract (`lastSparkRoundNumber`). We also know what
is the round number of the new IE contract.

```
sparkRoundNumber = lastSparkRoundNumber + 1
sparkRoundOffset = sparkRoundNumber - meridianRoundIndex
```

We insert a new record to our DB with the address of the current IE contract, `sparkRoundOffset`,
and `last_spark_round_number = sparkRoundNumber`.

If you are wondering how to find out what is the last SPARK round that we calculated from the
previous version of the IE contract - we can easily find it in our DB:

```sql
SELECT last_spark_round_number
FROM meridian_contract_versions
ORDER BY last_spark_round_number DESC
LIMIT 1
```
*/

export async function mapCurrentMeridianRoundToSparkRound ({
  meridianContractAddress,
  meridianRoundIndex,
  roundStartEpoch,
  pgClient,
  recordTelemetry
}) {
  let sparkRoundNumber

  const { rows: [contractVersionOfPreviousSparkRound] } = await pgClient.query(
    'SELECT * FROM meridian_contract_versions ORDER BY last_spark_round_number DESC LIMIT 1'
  )

  // More events coming from the same meridian contract
  if (contractVersionOfPreviousSparkRound?.contract_address === meridianContractAddress) {
    sparkRoundNumber = BigInt(contractVersionOfPreviousSparkRound.spark_round_offset) + meridianRoundIndex
    await pgClient.query(
      'UPDATE meridian_contract_versions SET last_spark_round_number = $1 WHERE contract_address = $2',
      [sparkRoundNumber, meridianContractAddress]
    )
    console.log('Mapped %s IE round index %s to SPARK round number %s (start epoch: %s)',
      meridianContractAddress,
      meridianRoundIndex,
      sparkRoundNumber,
      roundStartEpoch
    )
  } else {
    // We are running for the first time and need to map the meridian round to spark round 1
    // Or the contract address has changed
    const lastSparkRoundNumber = BigInt(contractVersionOfPreviousSparkRound?.last_spark_round_number ?? 0)
    sparkRoundNumber = lastSparkRoundNumber + 1n
    const sparkRoundOffset = sparkRoundNumber - meridianRoundIndex

    // TODO(bajtos) If we are were are reverting back to a contract address (version) we were
    // using sometime in the past, the query above will fail. We can fix the problem and support
    // this edge case by telling Postgres to ignore conflicts (`ON CONFLICT DO NOTHING)`
    await pgClient.query(`
      INSERT INTO meridian_contract_versions
      (contract_address, spark_round_offset, last_spark_round_number, first_spark_round_number)
      VALUES ($1, $2, $3, $3)
    `, [
      meridianContractAddress,
      sparkRoundOffset,
      sparkRoundNumber
    ])
    console.log(
      'Upgraded meridian contract from %s to %s, mapping IE round index %s to SPARK round number %s (start epoch: %s)',
      contractVersionOfPreviousSparkRound?.contract_address ?? '<n/a>',
      meridianContractAddress,
      meridianRoundIndex,
      sparkRoundNumber,
      roundStartEpoch
    )
  }

  await maybeCreateSparkRound(pgClient, {
    sparkRoundNumber,
    meridianContractAddress,
    meridianRoundIndex,
    roundStartEpoch,
    recordTelemetry
  })

  return sparkRoundNumber
}

export async function maybeCreateSparkRound (pgClient, {
  sparkRoundNumber,
  meridianContractAddress,
  meridianRoundIndex,
  roundStartEpoch,
  recordTelemetry
}) {
  const { rows: [previousRound] } = await pgClient.query(`
    SELECT measurement_count, max_tasks_per_node
    FROM spark_rounds
    WHERE id = $1 - 1::bigint
  `, [
    sparkRoundNumber
  ])

  // Always assign TASKS_PER_ROUND tasks to every 0k-checker node
  const { rowCount } = await pgClient.query(`
    INSERT INTO spark_rounds
    (id, created_at, meridian_address, meridian_round, start_epoch, max_tasks_per_node)
    VALUES (
      $1,
      now(),
      $2,
      $3,
      $4,
      $5
    )
    ON CONFLICT DO NOTHING
    RETURNING max_tasks_per_node
  `, [
    sparkRoundNumber,
    meridianContractAddress,
    meridianRoundIndex,
    roundStartEpoch,
    TASKS_PER_ROUND
  ])

  if (rowCount) {
    // We created a new SPARK round. Let's define retrieval tasks for this new round.
    // This is a short- to medium-term solution until we move to fully decentralized tasking
    await defineTasksForRound(pgClient, sparkRoundNumber, TASKS_PER_ROUND)
    recordTelemetry('round', point => {
      point.intField('current_round_measurement_count_target', TASKS_PER_ROUND)
      point.intField('current_round_task_count', TASKS_PER_ROUND)
      point.intField('current_round_node_max_task_count', TASKS_PER_ROUND)
      point.intField('previous_round_measurement_count', previousRound?.measurement_count ?? 0)
      point.intField('previous_round_node_max_task_count', previousRound?.max_tasks_per_node ?? 0)
    })
  }
}

export async function defineTasksForRound (pgClient, sparkRoundNumber, taskCount) {
  await pgClient.query(`
    INSERT INTO retrieval_tasks (round_id, cid, miner_id, clients, allocators)
    WITH selected AS (
      SELECT payload_cid, miner_id
      FROM eligible_deals
      WHERE expires_at > now()
      ORDER BY random()
      LIMIT $2
    )
    SELECT 
      $1 as round_id, 
      selected.payload_cid as cid, 
      selected.miner_id, 
      array_agg(DISTINCT eligible_deals.client_id) as clients,
      array_agg(DISTINCT ac.allocator_id) as allocators
    FROM selected
    LEFT JOIN eligible_deals
      ON selected.payload_cid = eligible_deals.payload_cid AND selected.miner_id = eligible_deals.miner_id
    LEFT JOIN allocator_clients ac
      ON eligible_deals.client_id = ac.client_id
    WHERE eligible_deals.expires_at > now()
    GROUP BY selected.payload_cid, selected.miner_id;
  `, [
    sparkRoundNumber,
    taskCount
  ])
}

// Exponentially look at more blocks to handle the case when we have an outage
// and the rounds are not advanced frequently enough, while keeping the happy
// path performant.
export async function getRoundStartEpochWithBackoff (
  contract,
  roundIndex,
  maxAttempts = 5
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await getRoundStartEpoch(
        contract,
        roundIndex,
        50 * (2 ** attempt)
      )
    } catch (err) {
      if (attempt < maxAttempts) {
        console.warn('Failed to get round start epoch, retrying...', {
          err,
          attempt,
          maxAttempts,
          roundIndex
        })
      } else {
        throw err
      }
    }
  }
}

/**
 * @param {MeridianContract} contract
 * @param {bigint} roundIndex
 * @returns {Promise<bigint>} Filecoin Epoch (ETH block number) when the SPARK round started
 */
export async function getRoundStartEpoch (contract, roundIndex, blocks) {
  assert.strictEqual(typeof roundIndex, 'bigint', `roundIndex must be a bigint, received: ${typeof roundIndex}`)
  assert.strictEqual(typeof blocks, 'number', `blocks must be a number, received: ${typeof blocks}`)

  const recentRoundStartEvents = (await contract.queryFilter('RoundStart', -blocks))
    .map((/** @type {import('ethers').EventLog} */ { blockNumber, args }) => ({ blockNumber, roundIndex: args[0] }))

  const roundStart = recentRoundStartEvents.find(e => e.roundIndex === roundIndex)
  if (!roundStart) {
    throw Object.assign(
      new Error(`Cannot find RoundStart event for round index ${roundIndex}`),
      { roundIndex, recentRoundStartEvents }
    )
  }

  return BigInt(roundStart.blockNumber)
}
