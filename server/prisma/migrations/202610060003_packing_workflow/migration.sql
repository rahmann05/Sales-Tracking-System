ALTER TABLE "PackingList"
 ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT',
 ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL',
 ADD COLUMN "sourceOrderId" TEXT,
 ADD COLUMN "items" JSONB NOT NULL DEFAULT '[]',
 ADD COLUMN "history" JSONB NOT NULL DEFAULT '[]',
 ADD COLUMN "overrideReason" TEXT,
 ADD COLUMN "releasedAt" TIMESTAMP(3),
 ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX "PackingList_sourceOrderId_key" ON "PackingList"("sourceOrderId");
ALTER TABLE "DeliveryStop"
 ADD COLUMN "allocatedCartons" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "allocatedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
 ADD COLUMN "allocatedItems" JSONB NOT NULL DEFAULT '[]';
-- Preserve historical assignments. Existing documents remain available to warehouse.
UPDATE "PackingList" SET "status" = 'RELEASED', "releasedAt" = "createdAt";
UPDATE "DeliveryStop" ds SET "allocatedCartons" = pl."totalCartons", "allocatedWeight" = COALESCE(pl."totalWeight",0)
 FROM "PackingList" pl WHERE ds."packingListId" = pl.id;
