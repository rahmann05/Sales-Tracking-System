CREATE INDEX IF NOT EXISTS "CustomerRegistration_divisionId_registrationStatus_createdAt_idx" ON "CustomerRegistration"("divisionId", "registrationStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerRegistration_deletedAt_createdAt_idx" ON "CustomerRegistration"("deletedAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_createdBy_status_createdAt_idx" ON "Order"("createdBy", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "DeliveryStop_deliveryRouteId_sequence_status_idx" ON "DeliveryStop"("deliveryRouteId", "sequence", "status");
