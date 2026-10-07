ALTER TABLE "User" ADD COLUMN "roleCode" TEXT;
ALTER TABLE "OutletUnlockRequest" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "DeliveryRoute" ADD COLUMN "odometerPostedAt" TIMESTAMP(3);
UPDATE "DeliveryRoute" SET "odometerPostedAt" = "updatedAt" WHERE "status" IN ('COMPLETED','PARTIAL');
ALTER TABLE "DeliveryStop" ADD COLUMN "rejectedItems" JSONB NOT NULL DEFAULT '[]', ADD COLUMN "returnReceivedAt" TIMESTAMP(3), ADD COLUMN "returnReceivedBy" TEXT, ADD COLUMN "returnNote" TEXT;
ALTER TABLE "Outlet" ADD COLUMN "paymentType" "PaymentType" NOT NULL DEFAULT 'CASH', ADD COLUMN "termOfPaymentDays" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "visitSchedule" JSONB;
ALTER TABLE "Order" ADD COLUMN "rejectionReason" TEXT, ADD COLUMN "termOfPaymentDays" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "taxRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0, ADD COLUMN "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "StaffActivity" ADD COLUMN "visitMode" TEXT, ADD COLUMN "followUp" JSONB;
CREATE INDEX "OutletUnlockRequest_requester_expiry_idx" ON "OutletUnlockRequest" ("requestedBy","outletId","status","expiresAt");
