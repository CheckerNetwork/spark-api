import { createHandler } from '../index.js'
import http from 'node:http'
import { once } from 'node:events'
import assert from 'node:assert'
import pg from 'pg'

const { DATABASE_URL } = process.env
const walletAddress = 'f1abc'

describe('Routes', () => {
  let client
  let server
  let spark

  before(async () => {
    client = new pg.Client({ connectionString: DATABASE_URL })
    await client.connect()
    const handler = await createHandler(client)
    server = http.createServer(handler)
    server.listen()
    await once(server, 'listening')
    spark = `http://127.0.0.1:${server.address().port}`
  })

  after(() => {
    server.close()
    client.end()
  })

  describe('GET /', () => {
    it('responds', async () => {
      const res = await fetch(`${spark}/`)
      assert.strictEqual(res.status, 200)
      assert.strictEqual(await res.text(), 'Hello World!')
    })
  })
  describe('POST /retrievals', () => {
    it('creates a retrieval', async () => {
      const res = await fetch(`${spark}/retrievals`, { method: 'POST' })
      assert.strictEqual(res.status, 200)
      const body = await res.json()
      assert.strictEqual(typeof body.id, 'number')
      assert.strictEqual(typeof body.cid, 'string')
      assert.strictEqual(typeof body.providerAddress, 'string')
      assert.strictEqual(typeof body.protocol, 'string')
    })
    it('uses random retrieval templates', async () => {
      const makeRequest = async () => {
        const res = await fetch(`${spark}/retrievals`, { method: 'POST' })
        assert.strictEqual(res.status, 200)
        const { cid } = await res.json()
        return cid
      }

      const firstCID = await makeRequest()
      for (let i = 0; i < 100; i++) {
        const nextCID = await makeRequest()
        if (nextCID !== firstCID) {
          // Different requests returned different CIDs - the test passed.
          return
        }
      }
      throw new Error('All requests returned the same CID')
    })
  })
  describe('PATCH /retrievals/:id', () => {
    it('updates a retrieval', async () => {
      const createRequest = await fetch(
        `${spark}/retrievals`,
        { method: 'POST' }
      )
      const { id: retrievalId } = await createRequest.json()
      const { rows: [retrievalRow] } = await client.query(`
        SELECT success
        FROM retrievals
        WHERE id = $1
      `, [
        retrievalId
      ])
      assert.strictEqual(retrievalRow.success, null)
      const updateRequest = await fetch(
        `${spark}/retrievals/${retrievalId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, walletAddress })
        }
      )
      assert.strictEqual(updateRequest.status, 200)
      const { rows: [updatedRetrievalRow] } = await client.query(`
        SELECT *
        FROM retrievals
        WHERE id = $1
      `, [
        retrievalId
      ])
      assert.strictEqual(updatedRetrievalRow.success, true)
      assert.strictEqual(updatedRetrievalRow.wallet_address, walletAddress)
    })
    it('handles invalid JSON', async () => {
      const res = await fetch(
        `${spark}/retrievals/0`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: '{"invalid"}'
        }
      )
      assert.strictEqual(res.status, 400)
      assert.strictEqual(await res.text(), 'Invalid JSON Body')
    })
    it('handles retrieval id not a number', async () => {
      const res = await fetch(
        `${spark}/retrievals/some-id`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true })
        }
      )
      assert.strictEqual(res.status, 400)
      assert.strictEqual(await res.text(), 'Invalid Retrieval ID')
    })
    it('handles retrieval not found', async () => {
      const res = await fetch(
        `${spark}/retrievals/0`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, walletAddress })
        }
      )
      assert.strictEqual(res.status, 404)
      assert.strictEqual(await res.text(), 'Retrieval Not Found')
    })
    it('handles request body too large', async () => {
      const res = await fetch(
        `${spark}/retrievals/0`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.alloc(100 * 1024 + 1)
        }
      )
      assert.strictEqual(res.status, 413)
      assert.strictEqual(await res.text(), 'request entity too large')
    })
    it('validates .success', async () => {
      const res = await fetch(
        `${spark}/retrievals/0`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        }
      )
      assert.strictEqual(res.status, 400)
      assert.strictEqual(await res.text(), 'boolean .success required')
    })
    it('validates .walletAddress', async () => {
      const res = await fetch(
        `${spark}/retrievals/0`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true })
        }
      )
      assert.strictEqual(res.status, 400)
      assert.strictEqual(await res.text(), 'string .walletAddress required')
    })
    it('ignores duplicate submissions', async () => {
      const createRequest = await fetch(
        `${spark}/retrievals`,
        { method: 'POST' }
      )
      const { id: retrievalId } = await createRequest.json()
      {
        const updateRequest = await fetch(
          `${spark}/retrievals/${retrievalId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, walletAddress })
          }
        )
        assert.strictEqual(updateRequest.status, 200)
      }
      {
        const updateRequest = await fetch(
          `${spark}/retrievals/${retrievalId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, walletAddress })
          }
        )
        assert.strictEqual(updateRequest.status, 404)
      }
      const { rows: [retrievalRow] } = await client.query(`
        SELECT success
        FROM retrievals
        WHERE id = $1
      `, [
        retrievalId
      ])
      assert.strictEqual(retrievalRow.success, true)
    })
  })
})
