ALTER TABLE retrieval_results
  ADD COLUMN start_at TIMESTAMP,
  ADD COLUMN status_code INTEGER,
  ADD COLUMN first_byte_at TIMESTAMP,
  ADD COLUMN end_at TIMESTAMP,
  ADD COLUMN byte_length INTEGER;
UPDATE retrieval_results SET start_at = NOW();
ALTER TABLE retrieval_results ALTER COLUMN start_at SET NOT NULL;
