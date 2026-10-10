-- Upgrade legacy built-in templates without overriding explicit permissions.
-- Custom roles and individual User.permissions remain unchanged.
WITH permission_defaults(code, permissions) AS (
 VALUES
 ('ADMIN', '{"can_run_outlet_review":true,"can_propose_outlet_review":true,"can_apply_outlet_review":true,"can_assign_outlet_review":true,"can_submit_outlet_field":true,"can_review_outlet_field":true}'::jsonb),
 ('SUPERVISOR', '{"can_run_outlet_review":true,"can_propose_outlet_review":true,"can_apply_outlet_review":true,"can_assign_outlet_review":true,"can_submit_outlet_field":false,"can_review_outlet_field":true}'::jsonb),
 ('SALES', '{"can_run_outlet_review":false,"can_propose_outlet_review":false,"can_apply_outlet_review":false,"can_assign_outlet_review":false,"can_submit_outlet_field":true,"can_review_outlet_field":false}'::jsonb),
 ('KEPALA_GUDANG', '{"can_run_outlet_review":false,"can_propose_outlet_review":false,"can_apply_outlet_review":false,"can_assign_outlet_review":false,"can_submit_outlet_field":false,"can_review_outlet_field":false}'::jsonb),
 ('SUPIR', '{"can_run_outlet_review":false,"can_propose_outlet_review":false,"can_apply_outlet_review":false,"can_assign_outlet_review":false,"can_submit_outlet_field":false,"can_review_outlet_field":false}'::jsonb)
), previous AS (
 SELECT key, value FROM "SystemConfig"
 WHERE key='ROLE_DEFINITIONS' AND jsonb_typeof(value)='array'
 FOR UPDATE
), upgraded AS (
 SELECT p.key, p.value AS before_value,
  jsonb_agg(CASE
   WHEN d.code IS NOT NULL AND r.role->'isSystem'='true'::jsonb
    AND (r.role->'defaultPermissions' IS NULL OR jsonb_typeof(r.role->'defaultPermissions')='object')
   THEN jsonb_set(r.role, '{defaultPermissions}', d.permissions || COALESCE(r.role->'defaultPermissions','{}'::jsonb))
   ELSE r.role END ORDER BY r.position) AS after_value
 FROM previous p
 CROSS JOIN LATERAL jsonb_array_elements(p.value) WITH ORDINALITY r(role, position)
 LEFT JOIN permission_defaults d ON d.code=r.role->>'code'
 GROUP BY p.key,p.value
), changed AS (
 UPDATE "SystemConfig" c SET value=u.after_value,"updatedAt"=CURRENT_TIMESTAMP
 FROM upgraded u WHERE c.key=u.key AND u.before_value IS DISTINCT FROM u.after_value
 RETURNING u.before_value,u.after_value
)
INSERT INTO "AuditEvent" (id,"actorName",action,"entityType","entityId","before","after")
SELECT md5(random()::text || clock_timestamp()::text), 'Migrasi sistem',
 'BACKFILL_OUTLET_PERMISSIONS','ROLE_DEFINITIONS','ROLES',
 jsonb_build_object('roles',before_value),
 jsonb_build_object('roles',after_value,'migration','202610100008_outlet_role_permissions')
FROM changed;
