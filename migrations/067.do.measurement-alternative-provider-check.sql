ALTER TABLE measurements 
    ADD COLUMN alternative_provider_check_status_code INTEGER,
    ADD COLUMN alternative_provider_check_timeout BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN alternative_provider_check_car_too_large BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN alternative_provider_check_end_at TIMESTAMPTZ,
    ADD COLUMN alternative_provider_check_protocol protocol;

