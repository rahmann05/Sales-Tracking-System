ALTER TABLE "AuditEvent" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "AuditEvent_archivedAt_createdAt_idx" ON "AuditEvent"("archivedAt", "createdAt");
