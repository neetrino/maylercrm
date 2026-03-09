-- AlterTable
ALTER TABLE "apartments" ADD COLUMN "landing_token" TEXT,
ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "apartments_landing_token_key" ON "apartments"("landing_token");
