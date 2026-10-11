ALTER TABLE "PackingList" ADD COLUMN "requestId" TEXT, ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "PackingList_requestId_key" ON "PackingList"("requestId");
ALTER TABLE "DeliveryRoute" ADD COLUMN "requestId" TEXT, ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "DeliveryRoute_requestId_key" ON "DeliveryRoute"("requestId");
ALTER TABLE "DeliveryIssue" ADD COLUMN "requestId" TEXT, ADD COLUMN "requestHash" TEXT,
 ADD COLUMN "responsibleRole" TEXT NOT NULL DEFAULT 'KEPALA_GUDANG', ADD COLUMN "supervisorId" TEXT, ADD COLUMN "salesVisitId" TEXT;
CREATE INDEX "DeliveryIssue_salesVisitId_idx" ON "DeliveryIssue"("salesVisitId");
ALTER TABLE "DeliveryIssue" ALTER COLUMN "ownerId" DROP NOT NULL, ALTER COLUMN "dueAt" DROP NOT NULL;
CREATE UNIQUE INDEX "DeliveryIssue_requestId_key" ON "DeliveryIssue"("requestId");
UPDATE "DeliveryIssue" SET "responsibleRole"='ADMIN'
 WHERE jsonb_path_exists("history", '$[*] ? (@.action == "LOCATION_DISCREPANCY" || @.action == "TRIP_ENDPOINT_DISCREPANCY")');
