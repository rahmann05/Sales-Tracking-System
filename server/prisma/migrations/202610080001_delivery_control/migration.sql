BEGIN;
ALTER TABLE "Order" ADD COLUMN "promisedAt" TIMESTAMP(3);
DROP INDEX IF EXISTS "PackingList_sourceOrderId_key";
CREATE INDEX "PackingList_sourceOrderId_idx" ON "PackingList"("sourceOrderId");
ALTER TABLE "DeliveryRoute"
  ADD COLUMN "plannedStartAt" TIMESTAMP(3), ADD COLUMN "plannedEndAt" TIMESTAMP(3),
  ADD COLUMN "departedAt" TIMESTAMP(3), ADD COLUMN "returnedAt" TIMESTAMP(3),
  ADD COLUMN "closedAt" TIMESTAMP(3), ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "onHold" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "preparation" JSONB NOT NULL DEFAULT '{}', ADD COLUMN "history" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "odometerStart" DOUBLE PRECISION, ADD COLUMN "odometerEnd" DOUBLE PRECISION,
  ADD COLUMN "actualDistanceKm" DOUBLE PRECISION, ADD COLUMN "actualFuelLiters" DOUBLE PRECISION,
  ADD COLUMN "documentsReturned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DeliveryStop"
  ADD COLUMN "returnInspection" JSONB, ADD COLUMN "reusableCartons" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reusableItems" JSONB NOT NULL DEFAULT '[]', ADD COLUMN "reusableInvoices" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "allocatedInvoices" JSONB NOT NULL DEFAULT '[]', ADD COLUMN "rejectedInvoices" JSONB NOT NULL DEFAULT '[]';
CREATE TABLE "DeliveryPosition" (
  "routeId" TEXT NOT NULL PRIMARY KEY, "driverId" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL, "longitude" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION NOT NULL, "observedAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "breadcrumbs" JSONB NOT NULL DEFAULT '[]',
  CONSTRAINT "DeliveryPosition_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "DeliveryRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "DeliveryIssue" (
  "id" TEXT NOT NULL PRIMARY KEY, "routeId" TEXT, "packingListId" TEXT, "orderId" TEXT, "stopId" TEXT,
  "title" TEXT NOT NULL, "reason" TEXT NOT NULL, "ownerId" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "resolution" TEXT,
  "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3), "history" JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX "DeliveryIssue_status_dueAt_idx" ON "DeliveryIssue"("status", "dueAt");
CREATE INDEX "DeliveryIssue_routeId_idx" ON "DeliveryIssue"("routeId");
-- Historical returns remain quarantined until inspected; do not invent physical counts.
-- Historical odometer postings are preserved. New trips post actual odometer only on close.
COMMIT;
