ALTER TABLE "OutletFieldTask" ADD COLUMN "schedule" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "PjpStop" ADD COLUMN "validationTaskId" TEXT, ADD COLUMN "validationOnly" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "validationResult" JSONB;
ALTER TABLE "PjpStop" ADD CONSTRAINT "PjpStop_validationTaskId_fkey" FOREIGN KEY ("validationTaskId") REFERENCES "OutletFieldTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "PjpStop_validationTaskId_idx" ON "PjpStop"("validationTaskId");
