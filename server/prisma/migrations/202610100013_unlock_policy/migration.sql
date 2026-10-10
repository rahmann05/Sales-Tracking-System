ALTER TABLE "OutletUnlockRequest" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'BOTH', ADD COLUMN "policySnapshot" JSONB;
ALTER TABLE "OutletUnlockRequest" ADD CONSTRAINT "OutletUnlockRequest_kind_check" CHECK ("kind" IN ('GEOFENCE','OUTLET_LOCK','BOTH'));
