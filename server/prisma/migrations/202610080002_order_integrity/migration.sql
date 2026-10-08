BEGIN;
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "requestId" TEXT, ADD COLUMN "requestHash" TEXT,
  ADD COLUMN "taxIncluded" BOOLEAN, ADD COLUMN "customerSnapshot" JSONB,
  ADD COLUMN "history" JSONB NOT NULL DEFAULT '[]';
CREATE UNIQUE INDEX "Order_requestId_key" ON "Order"("requestId");
ALTER TABLE "OrderItem" ADD COLUMN "cancelledQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "productName" TEXT, ADD COLUMN "productSku" TEXT, ADD COLUMN "unit" TEXT;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_cancelled_quantity_check" CHECK ("cancelledQuantity" >= 0 AND "cancelledQuantity" <= "quantity");
COMMIT;
