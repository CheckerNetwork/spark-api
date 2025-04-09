ALTER TABLE measurements ADD COLUMN network_wide_retrieval_status_code INTEGER;
ALTER TABLE measurements ADD COLUMN network_wide_retrieval_timeout BOOLEAN NOT NULL DEFAULT FALSE;
