ALTER TABLE "OutletReview" ADD COLUMN "ownerId" TEXT, ADD COLUMN "dueAt" TIMESTAMP(3), ADD COLUMN "assignment" JSONB NOT NULL DEFAULT '{}', ADD COLUMN "policySnapshot" JSONB;
CREATE INDEX "OutletReview_ownerId_status_idx" ON "OutletReview"("ownerId", "status");
