ALTER TABLE "PackingList" ADD COLUMN "loadPlanVersion" INTEGER NOT NULL DEFAULT 1,
 ADD COLUMN "destinations" JSONB NOT NULL DEFAULT '[]',
 ADD COLUMN "suggestedVehicleId" TEXT,
 ADD COLUMN "suggestedVehicleSnapshot" JSONB;
ALTER TABLE "Invoice" ADD COLUMN "destinationId" TEXT,
 ADD COLUMN "sourceOrderIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "DeliveryStop" ADD COLUMN "packingDestinationId" TEXT;
