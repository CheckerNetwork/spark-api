import '../lib/instrument.js'
import assert from 'node:assert'
import { once } from 'node:events'
import Fastify from 'fastify'
import { createFastifyApp } from '../fastify-app.js'
// import { createHandler } from '../index.js'
import pg from 'pg'
import { startRoundTracker } from '../lib/round-tracker.js'
import { migrate } from '../../migrations/index.js'
import { clearNetworkInfoStationIdsSeen } from '../lib/network-info-logger.js'
import { recordNetworkInfoTelemetry } from '../../common/telemetry.js'

const {
  PORT = 8080,
  HOST = '127.0.0.1',
  DOMAIN = 'localhost',
  DATABASE_URL,
  DEAL_INGESTER_TOKEN,
  REQUEST_LOGGING = 'true'
} = process.env

// This token is used by other Spark services to authenticate requests adding new deals
// to Spark's database of deals eligible for retrieval testing (`POST /eligible-deals-batch`).
// In production, the value is configured using Fly.io secrets (`fly secrets`).
// The same token is configured in Fly.io secrets for the deal-observer service too.
assert(DEAL_INGESTER_TOKEN, 'DEAL_INGESTER_TOKEN is required')

const pgPool = new pg.Pool({
  connectionString: DATABASE_URL,
  // allow the pool to close all connections and become empty
  min: 0,
  // this values should correlate with service concurrency hard_limit configured in fly.toml
  // and must take into account the connection limit of our PG server, see
  // https://fly.io/docs/postgres/managing/configuration-tuning/
  max: 150,
  // close connections that haven't been used for one second
  idleTimeoutMillis: 1000,
  // automatically close connections older than 60 seconds
  maxLifetimeSeconds: 60
})

pgPool.on('error', err => {
  // Prevent crashing the process on idle client errors, the pool will recover
  // itself. If all connections are lost, the process will still crash.
  // https://github.com/brianc/node-postgres/issues/1324#issuecomment-308778405
  console.error('An idle client has experienced an error', err.stack)
})
await migrate(pgPool)

console.log('Initializing round tracker...')
const start = new Date()

try {
  const currentRound = await startRoundTracker({
    pgPool,
    recordTelemetry: recordNetworkInfoTelemetry
  })
  console.log(
    'Initialized round tracker in %sms. SPARK round number at service startup: %s',
    new Date().getTime() - start.getTime(),
    currentRound.sparkRoundNumber
  )
} catch (err) {
  console.error('Cannot obtain the current Spark round number:', err)
  process.exit(1)
}

// Clear the station IDs seen by the network info logger every 24 hours
setInterval(clearNetworkInfoStationIdsSeen, 1000 * 60 * 60 * 24)

const logger = {
  error: console.error,
  info: console.info,
  request: ['1', 'true'].includes(REQUEST_LOGGING) ? console.info : () => { }
}

// Initialize Fastify app
const fastifyApp = await createFastifyApp({
  pgPool,
  logger,
  dealIngestionAccessToken: DEAL_INGESTER_TOKEN,
  domain: DOMAIN
})

try {
  await fastifyApp.listen({ 
    port: Number(PORT), 
    host: HOST 
  })
  console.log(`Server is running on ${fastifyApp.server.address().address}:${fastifyApp.server.address().port}`)
} catch (err) {
  console.error('Error starting server:', err)
  process.exit(1)
}
