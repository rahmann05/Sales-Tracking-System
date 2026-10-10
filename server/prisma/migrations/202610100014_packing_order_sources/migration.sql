ALTER TABLE "PackingList" ADD COLUMN "sourceOrderIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "PackingList" SET "sourceOrderIds" = ARRAY["sourceOrderId"] WHERE "sourceOrderId" IS NOT NULL;
CREATE INDEX "PackingList_sourceOrderIds_idx" ON "PackingList" USING GIN ("sourceOrderIds");
