-- AlterTable
ALTER TABLE "buildings" ADD COLUMN "floors_count" INTEGER;

-- CreateTable
CREATE TABLE "building_floor_plans" (
    "id" SERIAL NOT NULL,
    "building_id" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "building_floor_plans_building_id_floor_key" ON "building_floor_plans"("building_id", "floor");

-- AddForeignKey
ALTER TABLE "building_floor_plans" ADD CONSTRAINT "building_floor_plans_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
