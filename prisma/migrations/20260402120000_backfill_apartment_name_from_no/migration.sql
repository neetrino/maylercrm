-- One-time backfill: Apt Name <- Apartment NO (only where name was never set)
UPDATE "apartments"
SET "apartment_name" = "apartment_no"
WHERE "apartment_name" IS NULL;
