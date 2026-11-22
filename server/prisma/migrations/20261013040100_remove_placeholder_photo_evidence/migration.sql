-- A one-pixel migration placeholder is not a vehicle photo or receipt.
-- Preserve the original evidence in the audit trail before clearing only this
-- exact marker. Do not guess which existing coordinates are incorrect.
INSERT INTO "AuditEvent" ("id", "action", "entityType", "entityId", "before", "after")
SELECT 'legacy-photo-vehicle-' || "id", 'REMOVE_MIGRATION_PLACEHOLDER', 'Vehicle', "id",
  jsonb_build_object('photoUrl', "photoUrl", 'photoUpdatedAt', "photoUpdatedAt"),
  jsonb_build_object('photoUrl', NULL, 'reason', 'One-pixel migration placeholder; real vehicle photo required')
FROM "Vehicle" WHERE "photoUrl" = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
ON CONFLICT ("id") DO NOTHING;

UPDATE "Vehicle" SET "photoUrl" = NULL, "photoUpdatedAt" = NULL
WHERE "photoUrl" = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

INSERT INTO "AuditEvent" ("id", "action", "entityType", "entityId", "before", "after")
SELECT 'legacy-photo-service-' || "id", 'REMOVE_MIGRATION_PLACEHOLDER', 'VehicleServiceRecord', "id",
  jsonb_build_object('receiptPhotoUrl', "receiptPhotoUrl", 'evidence', "evidence", 'workshopLatitude', "workshopLatitude", 'workshopLongitude', "workshopLongitude"),
  jsonb_build_object('receiptPhotoUrl', NULL, 'reason', 'One-pixel migration placeholder; receipt and workshop point require review')
FROM "VehicleServiceRecord" WHERE "receiptPhotoUrl" = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
ON CONFLICT ("id") DO NOTHING;

UPDATE "VehicleServiceRecord" SET "receiptPhotoUrl" = NULL,
  "evidence" = COALESCE("evidence", '{}'::jsonb) || '{"reviewRequired":true,"reviewReason":"Bukti lama berisi foto placeholder migrasi. Lengkapi struk asli dan periksa kembali titik bengkel."}'::jsonb,
  "updatedAt" = NOW()
WHERE "receiptPhotoUrl" = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
