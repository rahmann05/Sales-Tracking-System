-- Forward migration: do not append changes to an already applied migration.
-- Drivers may record vehicle service, as requested by the operational workflow.
UPDATE "SystemConfig"
SET "value" = (
  SELECT jsonb_agg(CASE WHEN elem->>'code' = 'SUPIR'
    THEN jsonb_set(elem, '{defaultPermissions,can_record_vehicle_maintenance}', 'true'::jsonb, true)
    ELSE elem END ORDER BY ordinal)
  FROM jsonb_array_elements("value") WITH ORDINALITY AS role(elem, ordinal)
), "updatedAt" = NOW()
WHERE "key" = 'ROLE_DEFINITIONS' AND jsonb_typeof("value") = 'array';
