import { mapRequestToInetGroup } from '../lib/inet-grouping.js'
import * as Sentry from '@sentry/node'
import { logNetworkInfo } from '../lib/network-info-logger.js'
import { recordNetworkInfoTelemetry } from '../../common/telemetry.js'
import { validate } from '../lib/validate.js'
import { satisfies } from 'compare-versions'
import { ethAddressFromDelegated } from '@glif/filecoin-address'
import assert from 'http-assert'

export function createRoutes(fastify) {
  // API routes
  fastify.get('/measurements/:id', getMeasurement)
  fastify.post('/measurements', createMeasurement)
  fastify.get('/rounds/meridian/:meridianAddress/:meridianRound', getMeridianRoundDetails)
  fastify.get('/rounds/current', getCurrentRound)
  fastify.get('/rounds/:roundParam', getRoundDetails)
  fastify.get('/miner/:minerId/deals/eligible/summary', getSummaryOfEligibleDealsForMiner)
  fastify.get('/client/:clientId/deals/eligible/summary', getSummaryOfEligibleDealsForClient)
  fastify.get('/allocator/:allocatorId/deals/eligible/summary', getSummaryOfEligibleDealsForAllocator)
  fastify.get('/inspect-request', inspectRequest)
  fastify.post('/eligible-deals-batch', ingestEligibleDeals)
  
  // Legacy routes that return 410 Gone
  fastify.post('/retrievals', (request, reply) => {
    reply.code(410).send('OUTDATED CLIENT')
  })
  
  fastify.patch('/retrievals/:id', (request, reply) => {
    reply.code(410).send('OUTDATED CLIENT')
  })
  
  fastify.get('/retrievals', (request, reply) => {
    reply.code(410).send('This API endpoint is no longer supported.')
  })
}

// Route handler implementations
async function createMeasurement(request, reply) {
  const measurement = request.body
  validate(measurement, 'sparkVersion', { type: 'string', required: false })
  validate(measurement, 'zinniaVersion', { type: 'string', required: false })
  assert(
    typeof measurement.sparkVersion === 'string' && satisfies(measurement.sparkVersion, '>=1.17.0'),
    410, 'OUTDATED CLIENT'
  )

  if (!('participantAddress' in measurement) && ('walletAddress' in measurement)) {
    validate(measurement, 'walletAddress', { type: 'string', required: true })
    measurement.participantAddress = measurement.walletAddress
    delete measurement.walletAddress
  }
  
  if (typeof measurement.participantAddress === 'string' && measurement.participantAddress.startsWith('f4')) {
    try {
      measurement.participantAddress = ethAddressFromDelegated(measurement.participantAddress)
    } catch (err) {
      assert.fail(400, 'Invalid .participantAddress - doesn\'t convert to 0x address')
    }
  }

  validate(measurement, 'cid', { type: 'string', required: true })
  validate(measurement, 'providerAddress', { type: 'string', required: false })
  validate(measurement, 'protocol', { type: 'string', required: false })
  validate(measurement, 'participantAddress', { type: 'ethereum address', required: true })
  validate(measurement, 'timeout', { type: 'boolean', required: false })
  validate(measurement, 'startAt', { type: 'date', required: false })
  validate(measurement, 'statusCode', { type: 'number', required: false })
  validate(measurement, 'headStatusCode', { type: 'number', required: false })
  validate(measurement, 'firstByteAt', { type: 'date', required: false })
  validate(measurement, 'endAt', { type: 'date', required: false })
  validate(measurement, 'byteLength', { type: 'number', required: false })
  validate(measurement, 'attestation', { type: 'string', required: false })
  validate(measurement, 'carTooLarge', { type: 'boolean', required: false })
  validate(measurement, 'carChecksum', { type: 'string', required: false })
  validate(measurement, 'indexerResult', { type: 'string', required: false })
  validate(measurement, 'minerId', { type: 'string', required: false })
  validate(measurement, 'providerId', { type: 'string', required: false })
  validate(measurement, 'stationId', { type: 'string', required: true })
  assert(measurement.stationId.match(/^[0-9a-fA-F]{88}$/), 400, 'Invalid Station ID')

  const inetGroup = await mapRequestToInetGroup(request.pgPool, request.raw)
  logNetworkInfo(request.headers, measurement.stationId, recordNetworkInfoTelemetry)

  const { rows } = await request.pgPool.query(`
      INSERT INTO measurements (
        spark_version,
        zinnia_version,
        cid,
        provider_address,
        protocol,
        participant_address,
        station_id,
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
        completed_at_round
      )
      SELECT
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        id as completed_at_round
      FROM spark_rounds
      ORDER BY id DESC
      LIMIT 1
      RETURNING id
    `, [
    measurement.sparkVersion,
    measurement.zinniaVersion,
    measurement.cid,
    measurement.providerAddress,
    measurement.protocol,
    measurement.participantAddress,
    measurement.stationId,
    measurement.timeout || false,
    parseOptionalDate(measurement.startAt),
    measurement.statusCode,
    measurement.headStatusCode,
    parseOptionalDate(measurement.firstByteAt),
    parseOptionalDate(measurement.endAt),
    measurement.byteLength,
    measurement.attestation,
    inetGroup,
    measurement.carTooLarge ?? false,
    measurement.carChecksum,
    measurement.indexerResult,
    measurement.minerId,
    measurement.providerId
  ])
  
  return { id: rows[0].id }
}

async function getMeasurement(request, reply) {
  const measurementId = Number(request.params.id)
  assert(!Number.isNaN(measurementId), 400, 'Invalid RetrievalResult ID')
  
  const { rows: [resultRow] } = await request.pgPool.query(`
    SELECT *
    FROM measurements
    WHERE id = $1
  `, [measurementId])
  
  assert(resultRow, 404, 'Measurement Not Found')
  
  return {
    id: resultRow.id,
    cid: resultRow.cid,
    minerId: resultRow.miner_id,
    providerId: resultRow.provider_id,
    indexerResult: resultRow.indexer_result,
    providerAddress: resultRow.provider_address,
    stationId: resultRow.station_id,
    protocol: resultRow.protocol,
    sparkVersion: resultRow.spark_version,
    zinniaVersion: resultRow.zinnia_version,
    createdAt: resultRow.created_at,
    finishedAt: resultRow.finished_at,
    timeout: resultRow.timeout,
    startAt: resultRow.start_at,
    statusCode: resultRow.status_code,
    headStatusCode: resultRow.head_status_code,
    firstByteAt: resultRow.first_byte_at,
    endAt: resultRow.end_at,
    byteLength: resultRow.byte_length,
    carTooLarge: resultRow.car_too_large,
    attestation: resultRow.attestation
  }
}

async function getRoundDetails(request, reply) {
  const roundParam = request.params.roundParam
  
  if (roundParam === 'current') {
    const { rows: [round] } = await request.pgPool.query(`
      SELECT meridian_address, meridian_round FROM spark_rounds
      ORDER BY id DESC
      LIMIT 1
    `)
    assert(!!round, 'No rounds found in "spark_rounds" table.')
    
    const meridianContractAddress = round.meridian_address
    const meridianRoundIndex = BigInt(round.meridian_round)
    const addr = encodeURIComponent(meridianContractAddress)
    const idx = encodeURIComponent(meridianRoundIndex.toString())
    const location = `/rounds/meridian/${addr}/${idx}`


    reply.header('cache-control', 'max-age=1')
    return reply.redirect(302, location)
  }

  const roundNumber = parseRoundNumber(roundParam)
  await replyWithDetailsForRoundNumber(reply, request.pgPool, roundNumber)
}

async function replyWithDetailsForRoundNumber(reply, pgPool, roundNumber) {
  const { rows: [round] } = await pgPool.query('SELECT * FROM spark_rounds WHERE id = $1', [roundNumber])
  if (!round) {
    return reply.code(404).send()
  }

  const { rows: tasks } = await pgPool.query('SELECT * FROM retrieval_tasks WHERE round_id = $1', [round.id])

  return {
    roundId: round.id.toString(),
    maxTasksPerNode: round.max_tasks_per_node,
    retrievalTasks: tasks.map(t => ({
      cid: t.cid,
      providerAddress: t.provider_address,
      protocol: t.protocol
    }))
  }
}

const ONE_YEAR_IN_SECONDS = 365 * 24 * 3600

async function getMeridianRoundDetails(request, reply) {
  const meridianAddress = request.params.meridianAddress
  let meridianRound = BigInt(request.params.meridianRound)

  const { rows: [round] } = await request.pgPool.query(`
    SELECT * FROM spark_rounds
    WHERE meridian_address = $1 and meridian_round = $2
    `, [
    meridianAddress,
    meridianRound
  ])
  
  if (!round) {
    reply.header('cache-control', 'max-age=60')
    return reply.code(404).send()
  }

  const { rows: tasks } = await request.pgPool.query('SELECT * FROM retrieval_tasks WHERE round_id = $1', [round.id])

  reply.header('cache-control', `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`)
  return {
    roundId: round.id.toString(),
    startEpoch: round.start_epoch,
    maxTasksPerNode: round.max_tasks_per_node,
    retrievalTasks: tasks.map(t => ({
      cid: t.cid,
      minerId: t.miner_id,
      clients: t.clients,
      allocators: t.allocators,
      providerAddress: fixNullToUndefined(t.provider_address),
      protocol: fixNullToUndefined(t.protocol)
    }))
  }
}

async function getCurrentRound(request, reply) {
  return getRoundDetails({ params: { roundParam: 'current' } }, reply)
}

async function getSummaryOfEligibleDealsForMiner(request, reply) {
  const minerId = request.params.minerId
  
  /** @type {{rows: {client_id: string; deal_count: number}[]}} */
  const { rows } = await request.pgPool.query(`
    SELECT client_id, COUNT(payload_cid)::INTEGER as deal_count FROM eligible_deals
    WHERE miner_id = $1 AND expires_at > now()
    GROUP BY client_id
    ORDER BY deal_count DESC, client_id ASC
    `, [minerId]
  )

  reply.header('cache-control', `max-age=${6 * 3600}`)

  const body = {
    minerId,
    dealCount: rows.reduce((sum, row) => sum + row.deal_count, 0),
    clients:
      rows.map(
        ({ client_id, deal_count }) => ({ clientId: client_id, dealCount: deal_count })
      )
  }

  return body
}

async function getSummaryOfEligibleDealsForClient(request, reply) {
  const clientId = request.params.clientId
  
  /** @type {{rows: {miner_id: string; deal_count: number}[]}} */
  const { rows } = await request.pgPool.query(`
  SELECT miner_id, COUNT(payload_cid)::INTEGER as deal_count FROM eligible_deals
  WHERE client_id = $1 AND expires_at > now()
  GROUP BY miner_id
  ORDER BY deal_count DESC, miner_id ASC
  `, [clientId]
  )

  reply.header('cache-control', `max-age=${6 * 3600}`)

  const body = {
    clientId,
    dealCount: rows.reduce((sum, row) => sum + row.deal_count, 0),
    providers: rows.map(
      ({ miner_id, deal_count }) => ({ minerId: miner_id, dealCount: deal_count })
    )
  }
  
  return body
}

async function getSummaryOfEligibleDealsForAllocator(request, reply) {
  const allocatorId = request.params.allocatorId
  
  /** @type {{rows: {client_id: string; deal_count: number}[]}} */
  const { rows } = await request.pgPool.query(`
    SELECT ac.client_id, COUNT(payload_cid)::INTEGER as deal_count
    FROM allocator_clients ac
    LEFT JOIN eligible_deals rd ON ac.client_id = rd.client_id
    WHERE ac.allocator_id = $1 AND expires_at > now()
    GROUP BY ac.client_id
    ORDER BY deal_count DESC, ac.client_id ASC
    `, [allocatorId]
  )

  reply.header('cache-control', `max-age=${6 * 3600}`)

  const body = {
    allocatorId,
    dealCount: rows.reduce((sum, row) => sum + row.deal_count, 0),
    clients: rows.map(
      // eslint-disable-next-line camelcase
      ({ client_id, deal_count }) => ({ clientId: client_id, dealCount: deal_count })
    )
  }
  
  return body
}

async function inspectRequest(request, reply) {
  return {
    remoteAddress: request.ip,
    flyClientAddr: request.headers['fly-client-ip'],
    cloudflareAddr: request.headers['cf-connecting-ip'],
    forwardedFor: request.headers['x-forwarded-for'],
    headers: request.headers
  }
}

async function ingestEligibleDeals(request, reply) {
  if (request.headers.authorization !== `Bearer ${request.dealIngestionAccessToken}`) {
    return reply.code(403).send('Unauthorized')
  }

  const deals = request.body
  assert(Array.isArray(deals), 400, 'Invalid JSON Body, must be an array')
  
  for (const d of deals) {
    validate(d, 'clientId', { type: 'string', required: true })
    validate(d, 'minerId', { type: 'string', required: true })
    validate(d, 'pieceCid', { type: 'string', required: true })
    validate(d, 'pieceSize', { type: 'string', required: true })
    validate(d, 'payloadCid', { type: 'string', required: true })
    validate(d, 'expiresAt', { type: 'date', required: true })
  }

  const { rowCount: ingested } = await request.pgPool.query(`
    INSERT INTO eligible_deals (
      client_id,
      miner_id,
      piece_cid,
      piece_size,
      payload_cid,
      expires_at,
      sourced_from_f05_state
    ) VALUES (
      unnest($1::TEXT[]),
      unnest($2::TEXT[]),
      unnest($3::TEXT[]),
      unnest($4::BIGINT[]),
      unnest($5::TEXT[]),
      unnest($6::DATE[]),
      false
    ) ON CONFLICT DO NOTHING`, [
    deals.map(d => d.clientId),
    deals.map(d => d.minerId),
    deals.map(d => d.pieceCid),
    deals.map(d => d.pieceSize),
    deals.map(d => d.payloadCid),
    deals.map(d => d.expiresAt)
  ])

  return {
    ingested,
    skipped: deals.length - ingested
  }
}

const parseRoundNumber = (roundParam) => {
  try {
    return BigInt(roundParam)
  } catch (err) {
    if (err.name === 'SyntaxError') {
      assert.fail(400,
        `Round number must be a valid integer. Actual value: ${JSON.stringify(roundParam)}`
      )
    }
    throw err
  }
}

const fixNullToUndefined = (valueOrNull) => valueOrNull === null ? undefined : valueOrNull

/**
 * Parse a date string field that may be `undefined` or `null`.
 *
 * - undefined -> undefined
 * - null -> undefined
 * - "iso-date-string" -> new Date("iso-date-string")
 *
 * @param {string | null | undefined} str
 * @returns {Date | undefined}
 */
const parseOptionalDate = (str) => {
  if (str === undefined || str === null) return undefined
  return new Date(str)
}