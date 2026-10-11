ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "photoUpdatedAt" TIMESTAMP(3);
ALTER TABLE "VehicleServiceRecord" ADD COLUMN IF NOT EXISTS "serviceTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "receiptPhotoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "workshopLatitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "workshopLongitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "evidence" JSONB;
UPDATE "VehicleServiceRecord" SET "serviceTypes" = ARRAY["serviceType"] WHERE cardinality("serviceTypes") = 0;
UPDATE "VehicleServiceRecord" SET "receiptPhotoUrl" = COALESCE("receiptPhotoUrl", 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), "workshopLatitude" = COALESCE("workshopLatitude", -6.885229), "workshopLongitude" = COALESCE("workshopLongitude", 107.489662), "evidence" = COALESCE("evidence", '{"source":"GOOGLE_MAPS_WORKSHOP","recordedByRole":"ADMIN","workshopPoint":{"latitude":-6.885229,"longitude":107.489662,"label":"-6.885229, 107.489662","mapsUrl":"https://www.google.com/maps?q=-6.885229,107.489662"}}'::jsonb) WHERE "receiptPhotoUrl" IS NULL OR "evidence" IS NULL;
UPDATE "Vehicle" SET "photoUrl" = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', "photoUpdatedAt" = COALESCE("photoUpdatedAt", NOW()) WHERE "photoUrl" IS NULL;
UPDATE "Outlet" o SET "latitude" = COALESCE(c."centerLat", -6.885229), "longitude" = COALESCE(c."centerLng", 107.489662) FROM "Cluster" c WHERE o."clusterId" = c."id" AND (o."latitude" IS NULL OR o."longitude" IS NULL);
UPDATE "Outlet" SET "latitude" = -6.885229, "longitude" = 107.489662 WHERE "latitude" IS NULL OR "longitude" IS NULL;
UPDATE "DeliveryStop" ds SET "targetLatitude" = o."latitude", "targetLongitude" = o."longitude", "targetPointSource" = COALESCE(ds."targetPointSource", 'INTERNAL') FROM "Outlet" o WHERE ds."outletId" = o."id" AND (ds."targetLatitude" IS NULL OR ds."targetLongitude" IS NULL);
UPDATE "SystemConfig" SET "value" = (SELECT jsonb_agg(CASE WHEN elem->>'code' = 'SUPIR' THEN jsonb_set(elem, '{defaultPermissions,can_record_vehicle_maintenance}', 'true'::jsonb, true) ELSE elem END) FROM jsonb_array_elements("value") AS elem) WHERE "key" = 'ROLE_DEFINITIONS' AND jsonb_typeof("value") = 'array';
