ALTER TABLE "PackingList" ADD COLUMN "documentKind" TEXT NOT NULL DEFAULT 'PACKING';
ALTER TABLE "PackingList" ADD CONSTRAINT "PackingList_documentKind_check" CHECK ("documentKind" IN ('PACKING', 'MANIFEST'));
