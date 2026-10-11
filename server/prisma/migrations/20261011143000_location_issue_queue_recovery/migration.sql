-- Preserve previous ownership in the case history. Independent location
-- decisions belong to Admin; a former warehouse/driver owner cannot decide them.
UPDATE "DeliveryIssue" i
SET "ownerId"=NULL,
    "history"=COALESCE(i."history",'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
      'action','QUEUE_RECOVERY','actorName','Sistem','at',CURRENT_TIMESTAMP,
      'note','Pemeriksaan lokasi diteruskan ke antrean Admin; petugas lama tidak memiliki kewenangan keputusan independen.',
      'before',jsonb_build_object('ownerId',i."ownerId",'responsibleRole',i."responsibleRole"),
      'after',jsonb_build_object('ownerId',NULL,'responsibleRole','ADMIN'))),
    "responsibleRole"='ADMIN'
WHERE i."status"='OPEN' AND i."ownerId" IS NOT NULL
  AND jsonb_path_exists(i."history", '$[*] ? (@.action == "LOCATION_DISCREPANCY" || @.action == "TRIP_ENDPOINT_DISCREPANCY")')
  AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id"=i."ownerId" AND u."role"='ADMIN' AND u."deletedAt" IS NULL);
