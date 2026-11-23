-- Composite and hot filter indexes for Supabase production queries
CREATE INDEX IF NOT EXISTS "User_deletedAt_role_idx" ON "User"("deletedAt", "role");
CREATE INDEX IF NOT EXISTS "OffPjpAttendance_createdAt_idx" ON "OffPjpAttendance"("createdAt");
CREATE INDEX IF NOT EXISTS "OffPjpAttendance_status_createdAt_idx" ON "OffPjpAttendance"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Order_deletedAt_status_createdAt_idx" ON "Order"("deletedAt", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "PackingList_status_idx" ON "PackingList"("status");
CREATE INDEX IF NOT EXISTS "DeliveryRoute_closedAt_cancelledAt_idx" ON "DeliveryRoute"("closedAt", "cancelledAt");
CREATE INDEX IF NOT EXISTS "Outlet_deletedAt_name_id_idx" ON "Outlet"("deletedAt", "name", "id");
