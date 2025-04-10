ALTER TABLE measurements 
    ADD COLUMN network_retrieval_status_code INTEGER,
    ADD COLUMN network_retrieval_timeout BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN network_retrieval_car_too_large BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN network_retrieval_end_at TIMESTAMPTZ,
    ADD COLUMN network_retrieval_protocol protocol;

