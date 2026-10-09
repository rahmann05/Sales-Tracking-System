ALTER TABLE "Outlet" ADD COLUMN "requestId" TEXT, ADD COLUMN "registrationId" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MASTER', ADD COLUMN "taxType" "TaxType" NOT NULL DEFAULT 'NON_PKP',
ADD COLUMN "taxNumber" TEXT, ADD COLUMN "taxName" TEXT, ADD COLUMN "taxAddress" TEXT, ADD COLUMN "locationEvidence" JSONB;
ALTER TABLE "CustomerRegistration" ADD COLUMN "requestId" TEXT;
CREATE UNIQUE INDEX "Outlet_requestId_key" ON "Outlet"("requestId");
CREATE UNIQUE INDEX "Outlet_registrationId_key" ON "Outlet"("registrationId");
CREATE UNIQUE INDEX "CustomerRegistration_requestId_key" ON "CustomerRegistration"("requestId");
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "CustomerRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "OutletReview" (
 "id" TEXT NOT NULL PRIMARY KEY, "outletId" TEXT NOT NULL, "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN',
 "revision" INTEGER NOT NULL DEFAULT 1, "requestedBy" JSONB NOT NULL, "decision" JSONB,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "closedAt" TIMESTAMP(3),
 CONSTRAINT "OutletReview_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OutletReview_one_open_per_outlet" ON "OutletReview"("outletId") WHERE "status" IN ('OPEN','WAITING_FIELD');
CREATE INDEX "OutletReview_outletId_createdAt_idx" ON "OutletReview"("outletId", "createdAt");
CREATE INDEX "OutletReview_status_updatedAt_idx" ON "OutletReview"("status", "updatedAt");
CREATE TABLE "OutletValidationRun" (
 "id" TEXT NOT NULL PRIMARY KEY, "reviewId" TEXT NOT NULL, "snapshot" JSONB NOT NULL, "result" JSONB NOT NULL,
 "actor" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "OutletValidationRun_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "OutletReview"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "OutletValidationRun_reviewId_createdAt_idx" ON "OutletValidationRun"("reviewId", "createdAt");
CREATE TABLE "OutletChange" (
 "id" TEXT NOT NULL PRIMARY KEY, "outletId" TEXT NOT NULL, "actor" JSONB NOT NULL, "reason" TEXT NOT NULL,
 "source" TEXT NOT NULL, "before" JSONB NOT NULL, "after" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "OutletChange_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "OutletChange_outletId_createdAt_idx" ON "OutletChange"("outletId", "createdAt");
-- Link only unambiguous historical registrations. Never match by name or proximity.
UPDATE "Outlet" o SET "registrationId"=r."id", "source"='REGISTRATION', "taxType"=r."taxType",
"taxNumber"=r."taxNumber", "taxName"=r."taxName", "taxAddress"=r."taxAddress"
FROM "CustomerRegistration" r WHERE r."registrationStatus"='REGISTERED_ACTIVE' AND r."customerCode"=o."outletCode";
