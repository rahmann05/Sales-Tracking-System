ALTER TABLE "PjpPlan" ADD COLUMN "scheduledAt" TIMESTAMP(3), ADD COLUMN "publicationSchedule" JSONB;
CREATE INDEX "PjpPlan_status_scheduledAt_idx" ON "PjpPlan"("status", "scheduledAt");
