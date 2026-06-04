-- InstaPay/PESONet instruction ID from PayMongo transfer metadata.instruction_id
ALTER TABLE paymongo_transfers
  ADD COLUMN IF NOT EXISTS instruction_id TEXT;

ALTER TABLE paymongo_transfers
  DROP COLUMN IF EXISTS provider_reference_number;
