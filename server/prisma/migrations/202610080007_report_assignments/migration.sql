-- No backfill: today's assignment cannot establish historical membership.
ALTER TABLE "Pjp" ADD COLUMN "reportingContext" JSONB,
  ADD COLUMN "reportSupervisorId" TEXT, ADD COLUMN "reportClusterId" TEXT;
ALTER TABLE "OffPjpAttendance" ADD COLUMN "reportingContext" JSONB,
  ADD COLUMN "reportSupervisorId" TEXT, ADD COLUMN "reportClusterId" TEXT;
CREATE INDEX "Pjp_reportSupervisorId_date_idx" ON "Pjp"("reportSupervisorId", "date");
CREATE INDEX "Pjp_reportClusterId_date_idx" ON "Pjp"("reportClusterId", "date");
CREATE INDEX "OffPjpAttendance_reportSupervisorId_createdAt_idx" ON "OffPjpAttendance"("reportSupervisorId", "createdAt");
CREATE INDEX "OffPjpAttendance_reportClusterId_createdAt_idx" ON "OffPjpAttendance"("reportClusterId", "createdAt");
