ALTER TABLE "PjpPlan" ADD COLUMN "publicationNextAttemptAt" TIMESTAMP(3);
UPDATE "PjpPlan" SET "publicationNextAttemptAt"="scheduledAt" WHERE "status"='SCHEDULED';
CREATE INDEX "PjpPlan_status_publicationNextAttemptAt_idx" ON "PjpPlan"("status", "publicationNextAttemptAt");
