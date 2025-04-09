ALTER TABLE measurements ADD COLUMN network_retrieval_status_code INTEGER;
ALTER TABLE measurements ADD COLUMN network_retrieval_timeout BOOLEAN NOT NULL DEFAULT FALSE;
