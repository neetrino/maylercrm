-- AlterTable
ALTER TABLE "apartments" ADD COLUMN     "balance_remaining" DECIMAL(12,2),
ADD COLUMN     "buyer_address" TEXT,
ADD COLUMN     "other_buyers" TEXT,
ADD COLUMN     "payment_schedule" TEXT;
