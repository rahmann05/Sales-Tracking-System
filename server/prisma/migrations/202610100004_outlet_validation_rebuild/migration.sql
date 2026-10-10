ALTER TABLE "Outlet" ALTER COLUMN "latitude" DROP NOT NULL, ALTER COLUMN "longitude" DROP NOT NULL;
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_coordinate_pair" CHECK (("latitude" IS NULL) = ("longitude" IS NULL)) NOT VALID;
ALTER TABLE "OutletReview" ADD COLUMN "workflow" JSONB NOT NULL DEFAULT '{}', ADD COLUMN "proposal" JSONB;
ALTER TABLE "OutletValidationRun" ADD COLUMN "providerContent" JSONB, ADD COLUMN "providerExpiresAt" TIMESTAMP(3);
CREATE TABLE "OutletFieldTask" (
 "id" TEXT PRIMARY KEY, "reviewId" TEXT NOT NULL REFERENCES "OutletReview"("id"),
 "ownerId" TEXT NOT NULL, "reviewerId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN',
 "revision" INTEGER NOT NULL DEFAULT 1, "dueAt" TIMESTAMP(3), "pjpStopId" TEXT,
 "instructions" TEXT NOT NULL, "policySnapshot" JSONB NOT NULL, "evidence" JSONB,
 "history" JSONB NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "OutletFieldTask_reviewId_status_idx" ON "OutletFieldTask"("reviewId","status");
CREATE INDEX "OutletFieldTask_ownerId_status_idx" ON "OutletFieldTask"("ownerId","status");
CREATE INDEX "OutletFieldTask_reviewerId_status_idx" ON "OutletFieldTask"("reviewerId","status");
CREATE TABLE "OutletValidationJob" (
 "id" TEXT PRIMARY KEY, "requestId" TEXT NOT NULL UNIQUE, "actorId" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'QUEUED', "reason" TEXT NOT NULL, "items" JSONB NOT NULL,
 "leaseUntil" TIMESTAMP(3), "leaseToken" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "OutletValidationJob_status_createdAt_idx" ON "OutletValidationJob"("status","createdAt");
