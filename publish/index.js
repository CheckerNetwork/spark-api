/* global File */

import pRetry from 'p-retry'
import * as SparkImpactEvaluator from '@filecoin-station/spark-impact-evaluator'

export const publish = async ({
  client: pgPool,
  web3Storage,
  ieContract,
  recordTelemetry,
  stuckTransactionsCanceller,
  maxMeasurements = 1000,
  logger = console
}) => {
  // Fetch measurements
  const { rows: measurements } = await pgPool.query(`
    SELECT
      id,
      spark_version,
      zinnia_version,
      participant_address,
      station_id,
      finished_at,
      timeout,
      start_at,
      status_code,
      head_status_code,
      first_byte_at,
      end_at,
      byte_length,
      attestation,
      inet_group,
      car_too_large,
      car_checksum,
      indexer_result,
      miner_id,
      provider_id,
      cid,
      provider_address,
      protocol
    FROM measurements
    LIMIT $1
  `, [
    maxMeasurements
  ])
  if (measurements.length === 0) {
    // IMPORTANT: We still need to publish an empty batch,
    // otherwise the current round will never advance.
    logger.log('WARNING: No measurements to publish. Publishing an empty batch.')
  }

  // Fetch the count of all unpublished measurements - we need this for monitoring
  // Note: this number will be higher than `measurements.length` because spark-api adds more
  // measurements in between the previous and the next query.
  const totalCount = (await pgPool.query(
    'SELECT COUNT(*) FROM measurements'
  )).rows[0]?.count || 0

  logger.log(`Publishing ${measurements.length} measurements. Total unpublished: ${totalCount}. Batch size: ${maxMeasurements}.`)

  // Share measurements
  const start = new Date()

  let cid
  if (measurements.length) {
    const file = new File(
      [measurements.map(m => JSON.stringify(m)).join('\n')],
      'measurements.ndjson',
      { type: 'application/json' }
    )
    cid = await web3Storage.uploadFile(file)
  } else {
    // bafkqaaa is a CID for an empty file
    cid = 'bafkqaaa'
  }
  const uploadMeasurementsDuration = new Date().getTime() - start.getTime()
  logger.log(`Measurements packaged in ${cid}`)

  // Call contract with CID
  const { roundIndex, ieAddMeasurementsDuration } = await pRetry(
    () => commitMeasurements({ cid, ieContract, logger, stuckTransactionsCanceller }),
    {
      onFailedAttempt: err => console.error(err),
      retries: 5
    }
  )

  const pgClient = await pgPool.connect()
  try {
    await pgClient.query('BEGIN')

    // Delete published measurements
    await pgClient.query(`
      DELETE FROM measurements
      WHERE id = ANY($1::bigint[])
    `, [
      measurements.map(m => m.id)
    ])

    await pgClient.query(`
      INSERT INTO commitments (
        cid,
        published_at,
        measurement_count,
        meridian_address,
        meridian_round
      ) VALUES ($1, now(), $2, $3, $4)
    `, [
      cid.toString(),
      measurements.length,
      SparkImpactEvaluator.ADDRESS,
      roundIndex
    ])

    await pgClient.query(`
      UPDATE spark_rounds
      SET measurement_count = COALESCE(measurement_count, 0) + $1
      WHERE meridian_address = $2 AND meridian_round = $3
    `, [
      measurements.length,
      SparkImpactEvaluator.ADDRESS,
      roundIndex
    ])

    await pgClient.query('COMMIT')
  } catch (err) {
    await pgClient.query('ROLLBACK')
    throw err
  } finally {
    pgClient.release()
  }

  await pgPool.query('VACUUM measurements')

  // TODO: Add cleanup
  // We're not sure if we're going to stick with web3.storage, or switch to
  // helia or another tool. Therefore, add this later.

  logger.log('Done!')

  recordTelemetry('publish', point => {
    point.intField('round_index', roundIndex)
    point.intField('measurements', measurements.length)
    point.floatField('load', totalCount / maxMeasurements)
    point.intField(
      'upload_measurements_duration_ms',
      uploadMeasurementsDuration
    )
    point.intField('add_measurements_duration_ms', ieAddMeasurementsDuration)
  })
}

const commitMeasurements = async ({ cid, ieContract, logger, stuckTransactionsCanceller }) => {
  logger.log('Invoking ie.addMeasurements()...')
  const start = new Date()
  const tx = await ieContract.addMeasurements(cid.toString())
  await stuckTransactionsCanceller.addPending(tx)
  logger.log('Waiting for the transaction receipt:', tx.hash)
  const receipt = await tx.wait()
  stuckTransactionsCanceller.removeConfirmed(tx)
  if (receipt.logs.length === 0) {
    throw Object.assign(new Error('No logs found in the receipt'), { tx, receipt })
  }
  const log = ieContract.interface.parseLog(receipt.logs[0])
  const roundIndex = log.args[1]
  const ieAddMeasurementsDuration = new Date().getTime() - start.getTime()
  logger.log('Measurements added to round %s in %sms', roundIndex.toString(), ieAddMeasurementsDuration)

  return { roundIndex, ieAddMeasurementsDuration }
}
