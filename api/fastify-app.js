import Fastify from 'fastify'
import * as Sentry from '@sentry/node'
import { createRoutes } from './routes/index.js'

export async function createFastifyApp({
  pgPool,
  logger,
  dealIngestionAccessToken,
  domain
}) {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty'
      }
    }
  })

  // Add shared context to each request
  fastify.decorateRequest('pgPool', null)
  fastify.decorateRequest('dealIngestionAccessToken', null)
  fastify.decorateRequest('domain', null)
  
  // Add hooks to setup request context
  fastify.addHook('onRequest', async (request, reply) => {
    request.pgPool = pgPool
    request.dealIngestionAccessToken = dealIngestionAccessToken
    request.domain = domain

    // Domain redirect check
    if (request.headers.host && request.headers.host.split(':')[0] !== domain) {
      return reply.redirect(301, `https://${domain}${request.url}`)
    }
  })

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof SyntaxError) {
      reply.code(400).send('Invalid JSON Body')
    } else if (error.statusCode) {
      reply.code(error.statusCode).send(error.message)
    } else {
      logger.error(error)
      reply.code(500).send('Internal Server Error')
    }

    if (reply.statusCode >= 500) {
      Sentry.captureException(error)
    }
  })

  // Request logging
  fastify.addHook('onRequest', (request, reply, done) => {
    const start = new Date()
    logger.request(`${request.method} ${request.url} ...`)
    
    reply.addHook('onResponse', (request, reply, done) => {
      logger.request(`${request.method} ${request.url} ${reply.statusCode} (${new Date().getTime() - start.getTime()}ms)`)
      done()
    })
    
    done()
  })

  // Register routes
  createRoutes(fastify)

  return fastify
}