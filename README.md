# spark-api
[SPARK](https://github.com/filecoin-station/spark) API

[![CI](https://github.com/filecoin-station/spark-api/actions/workflows/ci.yml/badge.svg)](https://github.com/filecoin-station/spark-api/actions/workflows/ci.yml)

## Routes

### `POST /retrievals`

Start a new retrieval.

Body:

```typescript
{
  sparkVersion: String,
  zinniaVersion: String
}
```

Response:

```typescript
{
  id: String,
  cid: String,
  providerAddress: String,
  protocol: 'graphsync'|'bitswap'|'http'
}
```

### `PATCH /retrievals/:id`

Parameters:
- `id`: Request ID (from `POST /retrievals`)

Body:

```typescript
{
  participantAddress: String,
  timeout: Boolean,
  startAt: String,       // ISO 8601
  statusCode: Number,
  firstByteAt: String,   // ISO 8601
  endAt: String,         // ISO 8601
  byteLength: Number,
  attestation: String,
  stationId: String
}
```

Dates should be formatted as [ISO 8601](https://tc39.es/ecma262/#sec-date-time-string-format)
strings.

Response:

```
OK
```

### `GET /miner/:minerId/deals/eligible/summary`

Parameters:
- `minerId` - a miner id like `f0814049`

Response:

Number of deals grouped by client IDs.

```json
{
  "minerId": "f0814049",
  "dealCount": 13878,
  "clients": [
    { "clientId": "f02516933", "dealCount": 6880 },
    { "clientId": "f02833886", "dealCount": 3126 }
  ]
}
```

### `GET /client/:clientId/deals/eligible/summary`

Parameters:
- `clientId` - a client id like `f0215074`

Response:

Number of deals grouped by miner IDs.

```json
{
  "clientId": "f0215074",
  "dealCount": 38977,
  "providers": [
    { "minerId": "f01975316", "dealCount": 6810 },
    { "minerId": "f01975326", "dealCount": 6810 }
  ]
}
```

### `GET /allocator/:allocatorId/deals/eligible/summary`

Parameters:
- `allocatorId` - an allocator id like `f03015751`

Response:

Number of deals grouped by client IDs.

```json
{
  "allocatorId": "f03015751",
  "dealCount": 4088,
  "clients": [
    { "clientId": "f03144229", "dealCount": 2488 },
    { "clientId": "f03150656", "dealCount": 1600 }
  ]
}
```

## Development

### Database

Set up [PostgreSQL](https://www.postgresql.org/) with default settings:
 - Port: 5432
 - User: _your system user name_
 - Password: _blank_
 - Database: _same as user name_

Alternatively, set the environment variable `$DATABASE_URL` with `postgres://${USER}:${PASS}@${HOST}:${POST}/${DATABASE}`.

The Postgres user and database need to already exist, and the user
needs full management permissions for the database.

You can also the following command to set up the PostgreSQL server via Docker:

```bash
docker run -d --name spark-db \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -e POSTGRES_USER=$USER \
  -e POSTGRES_DB=$USER \
  -p 5432:5432 \
  postgres
```

When working on multiple Spark-related services, we recommend to use the following commands to create or reset the Postgres instance:

```bash
docker rm -f meridian-db && docker run --name meridian-db -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_USER=$USER -e POSTGRES_DB=$USER -p 5432:5432 -d postgres && sleep 1; psql postgres://localhost:5432/ -c "CREATE DATABASE spark_evaluate" && psql postgres://localhost:5432/ -c "CREATE DATABASE spark_stats" && psql postgres://localhost:5432/ -c "CREATE DATABASE spark"
```

### `api`

Start the API service:

```bash
npm start --workspace api
```

Run tests and linters:

```bash
npm test --workspace api
npm run lint --workspace api
```

## Deployment

Pushes to `main` will be deployed automatically.

Perform manual devops using [Fly.io](https://fly.io):

```bash
$ fly deploy api
```
