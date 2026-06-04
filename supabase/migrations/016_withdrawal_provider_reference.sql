-- PayMongo rail instruction ID (InstaPay/PESONet provider_reference_number)
ALTER TABLE paymongo_transfers
  ADD COLUMN IF NOT EXISTS provider_reference_number TEXT;
