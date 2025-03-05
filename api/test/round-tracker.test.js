import assert from 'node:assert'
import pg from 'pg'
import {
  BASELINE_TASKS_PER_ROUND,
  BASELINE_TASKS_PER_NODE,
  TASKS_EXECUTED_PER_ROUND,
  ROUND_TASKS_TO_NODE_TASKS_RATIO,
  defineTasksForRound,
  getRoundStartEpoch,
  getRoundStartEpochWithBackoff,
  mapCurrentMeridianRoundToSparkRound,
  startRoundTracker,
  MAX_TASKS_PER_NODE_LIMIT
} from '../lib/round-tracker.js'
import { migrate } from '../../migrations/index.js'
import { assertApproximately } from '../../test-helpers/assert.js'
import { createMeridianContract } from '../lib/ie-contract.js'
import { afterEach, beforeEach } from 'mocha'
import { createTelemetryRecorderStub, getPointName } from '../../test-helpers/platform-test-helpers.js'

const { DATABASE_URL } = process.env

const TIMEOUT_WHEN_QUERYING_CHAIN = (process.env.CI ? 10 : 1) * 60_000

describe('Round Tracker', () => {
  /** @type {pg.Pool} */
  let pgPool
  /** @type {pg.PoolClient} */
  let pgClient

  before(async () => {
    pgPool = new pg.Pool({ connectionString: DATABASE_URL })
    pgClient = await pgPool.connect()
    await migrate(pgClient)
    await pgClient.query(`
      UPDATE eligible_deals SET expires_at = NOW() + INTERVAL '1 year'
    `)
  })

  after(async () => {
    pgClient.release()
    await pgPool.end()
  })

  beforeEach(async () => {
    await pgClient.query('DELETE FROM meridian_contract_versions')
    await pgClient.query('DELETE FROM retrieval_tasks')
    await pgClient.query('DELETE FROM spark_rounds')
  })

  /** @type {AbortController} */
  let testFinished
  beforeEach(async () => {
    testFinished = new AbortController()
  })
  afterEach(async () => {
    testFinished.abort('test finished')
  })

  describe('mapCurrentMeridianRoundToSparkRound', () => {
    it('handles meridian rounds from the same contract', async () => {
      const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
      let sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress: '0x1a',
        meridianRoundIndex: 120n,
        roundStartEpoch: 321n,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 1n)
      let sparkRounds = (await pgClient.query('SELECT * FROM spark_rounds ORDER BY id')).rows
      assert.deepStrictEqual(sparkRounds.map(r => r.id), ['1'])
      assertApproximately(sparkRounds[0].created_at, new Date(), 30_000)
      assert.strictEqual(sparkRounds[0].meridian_address, '0x1a')
      assert.strictEqual(sparkRounds[0].meridian_round, '120')

      // first round number was correctly initialised
      assert.strictEqual(await getFirstRoundForContractAddress(pgClient, '0x1a'), '1')
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
        [
          {
            _point: 'round',
            current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
            current_round_task_count: `${Math.floor(
              BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
            )}i`,
            current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
            previous_round_measurement_count: '0i',
            previous_round_node_max_task_count: '0i'
          }
        ]
      )

      sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress: '0x1a',
        meridianRoundIndex: 121n,
        roundStartEpoch: 321n,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 2n)
      sparkRounds = (await pgClient.query('SELECT * FROM spark_rounds ORDER BY id')).rows
      assert.deepStrictEqual(sparkRounds.map(r => r.id), ['1', '2'])
      assertApproximately(sparkRounds[1].created_at, new Date(), 30_000)
      assert.strictEqual(sparkRounds[1].meridian_address, '0x1a')
      assert.strictEqual(sparkRounds[1].meridian_round, '121')

      // first round number was not changed
      assert.strictEqual(await getFirstRoundForContractAddress(pgClient, '0x1a'), '1')
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields }))[1],
        {
          _point: 'round',
          current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
          current_round_task_count: `${Math.floor(
            BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
          )}i`,
          current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
          previous_round_measurement_count: '0i',
          previous_round_node_max_task_count: '15i'
        }
      )
    })

    it('handles deployment of a new smart contract', async () => {
      const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
      // First contract version `0x1a`
      let sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress: '0x1a',
        meridianRoundIndex: 120n,
        roundStartEpoch: 321n,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 1n)
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
        [
          {
            _point: 'round',
            current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
            current_round_task_count: `${Math.floor(
              BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
            )}i`,
            current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
            previous_round_measurement_count: '0i',
            previous_round_node_max_task_count: '0i'
          }
        ]
      )

      // New contract version `0x1b`
      sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress: '0x1b',
        meridianRoundIndex: 10n,
        roundStartEpoch: 321n,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 2n)

      // first round number was correctly initialised
      assert.strictEqual(await getFirstRoundForContractAddress(pgClient, '0x1b'), '2')

      const { rows: [round2] } = await pgClient.query('SELECT * FROM spark_rounds WHERE id = 2')
      assert.strictEqual(round2.meridian_address, '0x1b')
      assert.strictEqual(round2.meridian_round, '10')

      // Double check that the next meridian round will map correctly
      // New contract version `0x1b`
      sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress: '0x1b',
        meridianRoundIndex: 11n,
        roundStartEpoch: 321n,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 3n)

      const { rows: [round3] } = await pgClient.query('SELECT * FROM spark_rounds WHERE id = 3')
      assert.strictEqual(round3.meridian_address, '0x1b')
      assert.strictEqual(round3.meridian_round, '11')

      // first round number was not changed
      assert.strictEqual(await getFirstRoundForContractAddress(pgClient, '0x1b'), '2')
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields }))[1],
        {
          _point: 'round',
          current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
          current_round_task_count: `${Math.floor(
            BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
          )}i`,
          current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
          previous_round_measurement_count: '0i',
          previous_round_node_max_task_count: '15i'
        }
      )
    })

    it('handles duplicate RoundStarted event', async () => {
      const now = new Date()
      const meridianRoundIndex = 1n
      const meridianContractAddress = '0x1a'
      const roundStartEpoch = 321n
      const { recordTelemetry, telemetry } = createTelemetryRecorderStub()

      let sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress,
        meridianRoundIndex,
        roundStartEpoch,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 1n)
      let sparkRounds = (await pgClient.query('SELECT * FROM spark_rounds ORDER BY id')).rows
      assert.deepStrictEqual(sparkRounds.map(r => r.id), ['1'])
      assertApproximately(sparkRounds[0].created_at, now, 30_000)
      assert.strictEqual(sparkRounds[0].meridian_address, '0x1a')
      assert.strictEqual(sparkRounds[0].meridian_round, '1')
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
        [
          {
            _point: 'round',
            current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
            current_round_task_count: `${Math.floor(
              BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
            )}i`,
            current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
            previous_round_measurement_count: '0i',
            previous_round_node_max_task_count: '0i'
          }
        ]
      )

      sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress,
        meridianRoundIndex,
        roundStartEpoch,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 1n)
      sparkRounds = (await pgClient.query('SELECT * FROM spark_rounds ORDER BY id')).rows
      assert.deepStrictEqual(sparkRounds.map(r => r.id), ['1'])
      assertApproximately(sparkRounds[0].created_at, now, 30_000)
      assert.strictEqual(sparkRounds[0].meridian_address, '0x1a')
      assert.strictEqual(sparkRounds[0].meridian_round, '1')
    })

    it('creates tasks when a new round starts', async () => {
      const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
      const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress: '0x1a',
        meridianRoundIndex: 1n,
        roundStartEpoch: 321n,
        pgClient,
        recordTelemetry
      })

      const { rows: tasks } = await pgClient.query('SELECT * FROM retrieval_tasks ORDER BY id')
      assert.strictEqual(tasks.length, BASELINE_TASKS_PER_ROUND)
      for (const [ix, t] of tasks.entries()) {
        assert.strictEqual(BigInt(t.round_id), sparkRoundNumber)
        assert.strictEqual(typeof t.cid, 'string', `task#${ix} cid`)
        // node-pg maps SQL value `NULL` to JS value `null`
        assert.strictEqual(t.provider_address, null, `task#${ix} provider_address`)
        assert.strictEqual(t.protocol, null, `task#${ix} protocol`)
        assert.match(t.miner_id, /^f0/, `task#${ix} miner_id should match /^f0/, found ${t.miner_id}`)
      }
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
        [
          {
            _point: 'round',
            current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
            current_round_task_count: `${Math.floor(
              BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
            )}i`,
            current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
            previous_round_measurement_count: '0i',
            previous_round_node_max_task_count: '0i'
          }
        ]
      )
    })

    it('creates tasks only once per round', async () => {
      const meridianRoundIndex = 1n
      const meridianContractAddress = '0x1a'
      const roundStartEpoch = 321n

      const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
      const firstRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress,
        meridianRoundIndex,
        roundStartEpoch,
        pgClient,
        recordTelemetry
      })
      const secondRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress,
        meridianRoundIndex,
        roundStartEpoch,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(firstRoundNumber, secondRoundNumber)

      const { rows: tasks } = await pgClient.query('SELECT * FROM retrieval_tasks ORDER BY id')
      assert.strictEqual(tasks.length, BASELINE_TASKS_PER_ROUND)
      for (const t of tasks) {
        assert.strictEqual(BigInt(t.round_id), firstRoundNumber)
      }
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
        [
          {
            _point: 'round',
            current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
            current_round_task_count: `${Math.floor(
              BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
            )}i`,
            current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
            previous_round_measurement_count: '0i',
            previous_round_node_max_task_count: '0i'
          }
        ]
      )
    })

    it('sets tasks_per_round', async () => {
      const meridianRoundIndex = 1n
      const meridianContractAddress = '0x1a'
      const roundStartEpoch = 321n
      const { recordTelemetry, telemetry } = createTelemetryRecorderStub()

      const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
        meridianContractAddress,
        meridianRoundIndex,
        roundStartEpoch,
        pgClient,
        recordTelemetry
      })
      assert.strictEqual(sparkRoundNumber, 1n)
      const sparkRounds = (await pgClient.query('SELECT * FROM spark_rounds ORDER BY id')).rows
      assert.deepStrictEqual(sparkRounds.map(r => r.id), ['1'])
      assert.strictEqual(sparkRounds[0].max_tasks_per_node, 15)
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
        [
          {
            _point: 'round',
            current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
            current_round_task_count: `${Math.floor(
              BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
            )}i`,
            current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
            previous_round_measurement_count: '0i',
            previous_round_node_max_task_count: '0i'
          }
        ]
      )
    })

    describe('task scaling', async () => {
      it('uses baseline values for the first round', async () => {
        const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
        const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
          meridianContractAddress: '0x1a',
          meridianRoundIndex: 120n,
          roundStartEpoch: 321n,
          pgClient,
          recordTelemetry
        })
        const { rows: [sparkRound] } = await pgClient.query(
          'SELECT * FROM spark_rounds WHERE id = $1',
          [sparkRoundNumber]
        )
        assert.strictEqual(sparkRound.max_tasks_per_node, BASELINE_TASKS_PER_NODE)
        const { rows: retrievalTasks } = await pgClient.query(
          'SELECT * FROM retrieval_tasks'
        )
        assert.strictEqual(retrievalTasks.length, BASELINE_TASKS_PER_ROUND)
        assert.deepStrictEqual(
          telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
          [
            {
              _point: 'round',
              current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
              current_round_task_count: `${Math.floor(
                BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
              )}i`,
              current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
              previous_round_measurement_count: '0i',
              previous_round_node_max_task_count: '0i'
            }
          ]
        )
      })
      it('uses baseline values when the previous round was empty', async () => {
        await mapCurrentMeridianRoundToSparkRound({
          meridianContractAddress: '0x1a',
          meridianRoundIndex: 120n,
          roundStartEpoch: 321n,
          pgClient,
          recordTelemetry: createTelemetryRecorderStub().recordTelemetry
        })
        const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
        const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
          meridianContractAddress: '0x1a',
          meridianRoundIndex: 121n,
          roundStartEpoch: 321n,
          pgClient,
          recordTelemetry
        })
        const { rows: [sparkRound] } = await pgClient.query(
          'SELECT * FROM spark_rounds WHERE id = $1',
          [sparkRoundNumber]
        )
        assert.strictEqual(sparkRound.max_tasks_per_node, BASELINE_TASKS_PER_NODE)
        const { rows: retrievalTasks } = await pgClient.query(
          'SELECT * FROM retrieval_tasks WHERE round_id = $1',
          [sparkRoundNumber]
        )
        assert.strictEqual(retrievalTasks.length, BASELINE_TASKS_PER_ROUND)
        assert.deepStrictEqual(
          telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
          [
            {
              _point: 'round',
              current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
              current_round_task_count: `${Math.floor(
                BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
              )}i`,
              current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
              previous_round_measurement_count: '0i',
              previous_round_node_max_task_count: '15i'
            }
          ]
        )
      })

      for (const measurementsFactor of [2, 0.5]) {
        it(`scales ${measurementsFactor > 1 ? 'down' : 'up'} the task count to reach desired tasks executed`, async () => {
          const prevSparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
            meridianContractAddress: '0x1a',
            meridianRoundIndex: 120n,
            roundStartEpoch: 321n,
            pgClient,
            recordTelemetry: createTelemetryRecorderStub().recordTelemetry
          })
          await pgClient.query(
            'UPDATE spark_rounds SET measurement_count = $1 WHERE id = $2',
            [TASKS_EXECUTED_PER_ROUND * measurementsFactor, prevSparkRoundNumber]
          )
          const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
          const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
            meridianContractAddress: '0x1a',
            meridianRoundIndex: 121n,
            roundStartEpoch: 321n,
            pgClient,
            recordTelemetry
          })
          const { rows: [sparkRound] } = await pgClient.query(
            'SELECT * FROM spark_rounds WHERE id = $1',
            [sparkRoundNumber]
          )
          assert.strictEqual(sparkRound.max_tasks_per_node, Math.floor(BASELINE_TASKS_PER_NODE / measurementsFactor))
          const { rows: retrievalTasks } = await pgClient.query(
            'SELECT * FROM retrieval_tasks WHERE round_id = $1',
            [sparkRoundNumber]
          )
          const expectedRetrievalTasksCount = Math.floor(
            Number(
              BigInt(BASELINE_TASKS_PER_NODE) *
              BigInt(TASKS_EXECUTED_PER_ROUND) /
              BigInt(TASKS_EXECUTED_PER_ROUND * measurementsFactor)
            ) *
            ROUND_TASKS_TO_NODE_TASKS_RATIO
          )
          assert.strictEqual(retrievalTasks.length, expectedRetrievalTasksCount)
          if (measurementsFactor < 1) {
            assert(retrievalTasks.length > BASELINE_TASKS_PER_ROUND)
          } else {
            assert(retrievalTasks.length < BASELINE_TASKS_PER_ROUND)
          }
          const { rows: [prevSparkRound] } = await pgClient.query(
            'SELECT * FROM spark_rounds WHERE id = $1',
            [prevSparkRoundNumber]
          )
          assert.deepStrictEqual(
            telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
            [
              {
                _point: 'round',
                current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
                current_round_task_count: `${expectedRetrievalTasksCount}i`,
                current_round_node_max_task_count: `${Math.floor(prevSparkRound.max_tasks_per_node / measurementsFactor)}i`,
                previous_round_measurement_count: `${TASKS_EXECUTED_PER_ROUND * measurementsFactor}i`,
                previous_round_node_max_task_count: '15i'
              }
            ]
          )
        })
      }

      it('sets maxTasksPerNode to at least 1', async () => {
        const prevSparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
          meridianContractAddress: '0x1a',
          meridianRoundIndex: 120n,
          roundStartEpoch: 321n,
          pgClient,
          recordTelemetry: createTelemetryRecorderStub().recordTelemetry
        })
        await pgClient.query(
          'UPDATE spark_rounds SET measurement_count = $1 WHERE id = $2',
          [TASKS_EXECUTED_PER_ROUND * 1000, prevSparkRoundNumber]
        )
        // It should calculate the task count as 0 and then choose 1 instead
        const { recordTelemetry } = createTelemetryRecorderStub()
        const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
          meridianContractAddress: '0x1a',
          meridianRoundIndex: 121n,
          roundStartEpoch: 321n,
          pgClient,
          recordTelemetry
        })
        const { rows: [sparkRound] } = await pgClient.query(
          'SELECT * FROM spark_rounds WHERE id = $1',
          [sparkRoundNumber]
        )
        assert.strictEqual(sparkRound.max_tasks_per_node, 1)
      })
      it('has an upper limit for maxTasksPerNode', async () => {
        const prevSparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
          meridianContractAddress: '0x1a',
          meridianRoundIndex: 120n,
          roundStartEpoch: 321n,
          pgClient,
          recordTelemetry: createTelemetryRecorderStub().recordTelemetry
        })
        await pgClient.query(
          'UPDATE spark_rounds SET measurement_count = $1 WHERE id = $2',
          [1, prevSparkRoundNumber]
        )
        // It should calculate the task count as a very high number and then choose MAX_TASKS_PER_NODE_LIMIT instead
        const { recordTelemetry } = createTelemetryRecorderStub()
        const sparkRoundNumber = await mapCurrentMeridianRoundToSparkRound({
          meridianContractAddress: '0x1a',
          meridianRoundIndex: 121n,
          roundStartEpoch: 321n,
          pgClient,
          recordTelemetry
        })
        const { rows: [sparkRound] } = await pgClient.query(
          'SELECT * FROM spark_rounds WHERE id = $1',
          [sparkRoundNumber]
        )
        assert.strictEqual(sparkRound.max_tasks_per_node, MAX_TASKS_PER_NODE_LIMIT)
      })
    })

    describe('defineTasksForRound', () => {
      before(async () => {
        // Mark all existing deals as expired
        await pgClient.query(`
          UPDATE eligible_deals SET expires_at = NOW() - INTERVAL '1 day'
        `)
      })

      after(async () => {
        // Revert the change that expired existing deals
        await pgClient.query(`
          UPDATE eligible_deals SET expires_at = NOW() + INTERVAL '1 year'
        `)
      })

      it('merges duplicate clients', async () => {
        // Delete any eligible deals created by previous test runs
        await pgClient.query(`
          DELETE FROM eligible_deals WHERE client_id = 'f0050'
        `)

        // Create deals from the same client. First two deals are with the same SP, the third is not.
        // All deals have the same payload_cid.
        // Only these deals will be available for sampling
        await pgClient.query(`
          INSERT INTO eligible_deals
          (miner_id, client_id, piece_cid, piece_size, payload_cid, expires_at, sourced_from_f05_state)
          VALUES
          ('f0010', 'f0050', 'baga1', 1, 'bafkqaaa', NOW() + INTERVAL '1 year', true),
          ('f0010', 'f0050', 'baga2', 1, 'bafkqaaa', NOW() + INTERVAL '1 year', true),
          ('f0011', 'f0050', 'baga1', 1, 'bafkqaaa', NOW() + INTERVAL '1 year', true)
        `)

        // Create a new round and define tasks for the round
        const roundId = 1
        await pgClient.query(`
          INSERT INTO spark_rounds
          (id, created_at, meridian_address, meridian_round, start_epoch, max_tasks_per_node)
          VALUES
          ($1, NOW(), '0x1a', 1, 1, 15)
        `, [
          roundId
        ])
        await defineTasksForRound(pgClient, roundId, 3)

        const { rows: tasks } = await pgClient.query(
          'SELECT miner_id, cid, clients FROM retrieval_tasks WHERE round_id = $1',
          [roundId]
        )

        assert.deepStrictEqual(tasks, [
          {
            cid: 'bafkqaaa',
            miner_id: 'f0010',
            // Important: clients are deduplicated
            clients: ['f0050']
          },
          {
            cid: 'bafkqaaa',
            miner_id: 'f0011',
            clients: ['f0050']
          }
        ])

        // Clean up
        await pgClient.query('DELETE FROM retrieval_tasks WHERE round_id = $1', [roundId])
        await pgClient.query('DELETE FROM spark_rounds WHERE id = $1', [roundId])
        await pgClient.query("DELETE FROM eligible_deals WHERE miner_id LIKE 'f001%' AND client_id = 'f0050' AND piece_cid LIKE 'baga%' AND piece_size = 1")
      })

      it('should handle single allocator with multiple clients correctly', async () => {
        // Insert test data with one allocator having multiple clients
        await pgClient.query(`
          INSERT INTO eligible_deals
          (miner_id, client_id, piece_cid, piece_size, payload_cid, expires_at)
          VALUES
          ('f0020', 'clientA1', 'baga1', 1, 'bafkTest', NOW() + INTERVAL '1 year'),
          ('f0021', 'clientA2', 'baga2', 1, 'bafkTest', NOW() + INTERVAL '1 year'),
          ('f0022', 'clientA3', 'baga3', 1, 'bafkTest', NOW() + INTERVAL '1 year')
        `)

        await pgClient.query(`
          INSERT INTO allocator_clients (client_id, allocator_id)
          VALUES 
            ('clientA1', 'allocator'),
            ('clientA2', 'allocator'),
            ('clientA3', 'allocator')
        `)

        const roundNumber = 10024n
        await pgClient.query(`
          INSERT INTO spark_rounds
          (id, created_at, meridian_address, meridian_round, start_epoch, max_tasks_per_node)
          VALUES
          ($1, NOW(), '0x1a', 1, 1, 15)
        `, [
          roundNumber
        ])

        await defineTasksForRound(pgClient, roundNumber, 3)

        // Verify results
        const { rows: tasks } = await pgClient.query('SELECT miner_id, cid, clients, allocators FROM retrieval_tasks WHERE round_id = $1 AND miner_id LIKE $2', [roundNumber, 'f002%'])
        assert.deepStrictEqual(tasks, [
          {
            cid: 'bafkTest',
            miner_id: 'f0020',
            clients: ['clientA1'],
            allocators: ['allocator']
          },
          {
            cid: 'bafkTest',
            miner_id: 'f0021',
            clients: ['clientA2'],
            allocators: ['allocator']
          },
          {
            cid: 'bafkTest',
            miner_id: 'f0022',
            clients: ['clientA3'],
            allocators: ['allocator']
          }
        ])

        // Clean up
        await pgClient.query('DELETE FROM retrieval_tasks WHERE round_id = $1', [roundNumber])
        await pgClient.query('DELETE FROM spark_rounds WHERE id = $1', [roundNumber])
        await pgClient.query("DELETE FROM eligible_deals WHERE miner_id LIKE 'f002%' AND client_id LIKE 'clientA%' AND piece_cid LIKE 'baga%' AND piece_size = 1")
        await pgClient.query("DELETE FROM allocator_clients WHERE client_id LIKE 'client%' AND allocator_id = 'allocator'")
      })

      it('should handle multiple allocators for a single client correctly', async () => {
        // Insert test data with one client having multiple allocators
        await pgClient.query(`
          INSERT INTO eligible_deals
          (miner_id, client_id, piece_cid, piece_size, payload_cid, expires_at)
          VALUES
          ('f0030', 'client', 'baga1', 1, 'bafkTest', NOW() + INTERVAL '1 year'),
          ('f0031', 'client', 'baga2', 1, 'bafkTest', NOW() + INTERVAL '1 year'),
          ('f0032', 'client', 'baga3', 1, 'bafkTest', NOW() + INTERVAL '1 year')
        `)

        await pgClient.query(`
          INSERT INTO allocator_clients (client_id, allocator_id)
          VALUES 
            ('client', 'allocator1'),
            ('client', 'allocator2'),
            ('client', 'allocator3')
        `)
        const roundNumber = 10025n
        await pgClient.query(`
          INSERT INTO spark_rounds
          (id, created_at, meridian_address, meridian_round, start_epoch, max_tasks_per_node)
          VALUES
          ($1, NOW(), '0x1a', 1, 1, 15)
        `, [
          roundNumber
        ])
        await defineTasksForRound(pgClient, roundNumber, 10)

        // Verify results
        const { rows: tasks } = await pgClient.query('SELECT miner_id, cid, clients, allocators FROM retrieval_tasks WHERE round_id = $1 AND miner_id LIKE $2', [roundNumber, 'f003%'])
        assert.deepStrictEqual(tasks, [
          {
            cid: 'bafkTest',
            miner_id: 'f0030',
            clients: ['client'],
            allocators: ['allocator1', 'allocator2', 'allocator3']
          },
          {
            cid: 'bafkTest',
            miner_id: 'f0031',
            clients: ['client'],
            allocators: ['allocator1', 'allocator2', 'allocator3']
          },
          {
            cid: 'bafkTest',
            miner_id: 'f0032',
            clients: ['client'],
            allocators: ['allocator1', 'allocator2', 'allocator3']
          }
        ])

        // Clean up
        await pgClient.query('DELETE FROM retrieval_tasks WHERE round_id = $1', [roundNumber])
        await pgClient.query('DELETE FROM spark_rounds WHERE id = $1', [roundNumber])
        await pgClient.query("DELETE FROM eligible_deals WHERE miner_id LIKE 'f003%' AND client_id = 'client' AND piece_cid LIKE 'baga%' AND piece_size = 1")
        await pgClient.query("DELETE FROM allocator_clients WHERE client_id = 'client' AND allocator_id LIKE 'allocator%'")
      })
    })
  })

  describe('getRoundStartEpoch', () => {
    it('returns a block number, safely query many blocks', async function () {
      this.timeout(TIMEOUT_WHEN_QUERYING_CHAIN)
      const contract = await createMeridianContract()
      const roundIndex = await contract.currentRoundIndex()
      const startEpoch = await getRoundStartEpoch(contract, roundIndex, 500)
      assert.strictEqual(typeof startEpoch, 'bigint')
    })
  })

  describe('getRoundStartEpochWithBackoff', () => {
    it('returns a block number, starting with query few blocks', async function () {
      this.timeout(TIMEOUT_WHEN_QUERYING_CHAIN)
      const contract = await createMeridianContract()
      const roundIndex = await contract.currentRoundIndex()
      const startEpoch = await getRoundStartEpochWithBackoff(contract, roundIndex)
      assert.strictEqual(typeof startEpoch, 'bigint')
    })
  })

  describe('startRoundTracker', () => {
    it('detects the current round', async function () {
      this.timeout(TIMEOUT_WHEN_QUERYING_CHAIN)
      const { recordTelemetry, telemetry } = createTelemetryRecorderStub()
      const { sparkRoundNumber } = await startRoundTracker({
        pgPool,
        signal: testFinished.signal,
        recordTelemetry
      })
      assert.strictEqual(typeof sparkRoundNumber, 'bigint')
      assert.deepStrictEqual(
        telemetry.map(p => ({ _point: getPointName(p), ...p.fields })),
        [
          {
            _point: 'round',
            current_round_measurement_count_target: `${TASKS_EXECUTED_PER_ROUND}i`,
            current_round_task_count: `${Math.floor(
              BASELINE_TASKS_PER_NODE * ROUND_TASKS_TO_NODE_TASKS_RATIO
            )}i`,
            current_round_node_max_task_count: `${BASELINE_TASKS_PER_NODE}i`,
            previous_round_measurement_count: '0i',
            previous_round_node_max_task_count: '0i'
          }
        ]
      )
    })
  })
})

const getFirstRoundForContractAddress = async (pgClient, contractAddress) => {
  const { rows } = await pgClient.query(
    'SELECT first_spark_round_number FROM meridian_contract_versions WHERE contract_address = $1',
    [contractAddress]
  )
  return rows?.[0]?.first_spark_round_number
}
