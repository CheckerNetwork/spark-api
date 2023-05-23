# spark-api
[SPARK](https://github.com/filecoin-station/spark) API

[![CI](https://github.com/filecoin-station/spark-api/actions/workflows/ci.yml/badge.svg)](https://github.com/filecoin-station/spark-api/actions/workflows/ci.yml)

## Routes

### `POST /retrievals`

Start a new retrieval.

Response:

```typescript
{
  id: String,
  cid: String,
  providerAddress: String,
  protocol: 'graphsync'|'bitswap'
}
```

### `PATCH /retrievals/:id`

Parameters:
- `id`: Request ID (from `POST /retrievals`)

Body:

```typescript
{
  success: Boolean
}
```

Response:

```
OK
```

## Development

1. Set up [PostgreSQL](https://www.postgresql.org/) with default settings:
  - Port: 5432
  - User: _your system user name_
  - Password: _blank_
  - Database: _same as user name_
  
   Alternatively, set the environment variable `$DATABASE_URL` with
   `postgres://${USER}:${PASS}@${HOST}:${POST}/${DATABASE}`. 
   
   The Postgres user and database need to already exist, and the user 
   needs full management permissions for the database.
1. `npm start`

## Deployment

Pushes to `main` will be deployed automatically.

Perform manual devops using [Fly.io](https://fly.io):

```bash
$ fly deploy
```
