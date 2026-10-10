ALTER TABLE "Order" ADD COLUMN "outletId" TEXT;
UPDATE "Order" o SET "outletId" = s."outletId" FROM "PjpStop" s WHERE s.id = o."pjpStopId";
ALTER TABLE "Order" ALTER COLUMN "pjpStopId" DROP NOT NULL;
ALTER TABLE "Order" DROP CONSTRAINT "Order_pjpStopId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_pjpStopId_fkey" FOREIGN KEY ("pjpStopId") REFERENCES "PjpStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_context_required" CHECK ("pjpStopId" IS NOT NULL OR "outletId" IS NOT NULL);
CREATE INDEX "Order_outletId_idx" ON "Order"("outletId");
