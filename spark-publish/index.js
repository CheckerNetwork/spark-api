/* global File */

import timers from 'node:timers/promises'

const publish = async ({ client, web3Storage, ieContract }) => {
  // Fetch measurements
  const { rows: measurements } = await client.query(`
    SELECT
      r.id,
      r.created_at,
      r.spark_version,
      r.zinnia_version,
      rr.finished_at,
      rr.success,
      rr.timeout,
      rr.start_at,
      rr.status_code,
      rr.first_byte_at,
      rr.end_at,
      rr.byte_length,
      rr.attestation,
      rt.cid,
      rt.provider_address,
      rt.protocol
    FROM retrievals r
    JOIN retrieval_templates rt ON r.retrieval_template_id = rt.id
    LEFT JOIN retrieval_results rr ON r.id = rr.retrieval_id
    WHERE r.published_as IS NULL
    LIMIT 1000
  `)
  console.log(`Publishing ${measurements.length} measurements`)

  // Share measurements
  const file = new File(
    [JSON.stringify(measurements)],
    'measurements.json',
    { type: 'application/json' }
  )
  const cid = await web3Storage.put([file])
  console.log(`Measurements packaged in ${cid}`)

  // Call contract with CID
  console.log('ie.addMeasurements()...')
  const tx = await ieContract.addMeasurements(cid.toString())
  const receipt = await tx.wait()
  const event = receipt.events.find(e => e.event === 'MeasurementsAdded')
  const { roundIndex } = event.args
  console.log('Measurements added to round', roundIndex.toString())

  // Mark measurements as shared
  for (const m of measurements) {
    m.cid = cid
  }

  console.log('Done!')
}

const minRoundLength = 30_000
export const startPublishLoop = async ({ client, web3Storage, ieContract }) => {
  while (true) {
    const lastStart = new Date()
    await publish({ client, web3Storage, ieContract })
    const dt = new Date() - lastStart
    if (dt < minRoundLength) await timers.setTimeout(minRoundLength - dt)
  }
}
