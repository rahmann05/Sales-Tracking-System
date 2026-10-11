ALTER TABLE "Vehicle" ADD COLUMN "estimatedKm" DOUBLE PRECISION NOT NULL DEFAULT 0;
UPDATE "Vehicle" SET "estimatedKm" = "totalKm";
ALTER TABLE "DeliveryRoute" ADD COLUMN "mileagePlan" JSONB,
ADD COLUMN "estimatedTravelKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "mileagePendingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DeliveryStop" ADD COLUMN "targetLatitude" DOUBLE PRECISION,
ADD COLUMN "targetLongitude" DOUBLE PRECISION,
ADD COLUMN "targetPointSource" TEXT;
ALTER TABLE "DeliveryAttendance" ADD COLUMN "mileageEvidence" JSONB;
