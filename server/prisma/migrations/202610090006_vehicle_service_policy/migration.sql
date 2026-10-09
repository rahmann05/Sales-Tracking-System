ALTER TABLE "Vehicle" ADD COLUMN "maintenancePolicy" JSONB;
ALTER TABLE "VehicleServiceRecord" ADD COLUMN "requestId" TEXT;
ALTER TABLE "VehicleServiceRecord" ADD COLUMN "policySnapshot" JSONB;
ALTER TABLE "VehicleServiceRecord" ALTER COLUMN "odometerAtService" TYPE DOUBLE PRECISION USING "odometerAtService"::DOUBLE PRECISION;
CREATE UNIQUE INDEX "VehicleServiceRecord_requestId_key" ON "VehicleServiceRecord"("requestId");
