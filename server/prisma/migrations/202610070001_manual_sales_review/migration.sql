ALTER TABLE "Attendance"
 ADD COLUMN "manualSalesMode" TEXT NOT NULL DEFAULT 'NOTES_ONLY',
 ADD COLUMN "manualSalesStatus" TEXT NOT NULL DEFAULT 'NOTES_ONLY',
 ADD COLUMN "isManualSalesApproved" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "manualSalesReviewedBy" TEXT,
 ADD COLUMN "manualSalesReviewedAt" TIMESTAMP(3),
 ADD COLUMN "manualSalesReviewNote" TEXT;
CREATE INDEX "Attendance_manualSalesStatus_idx" ON "Attendance"("manualSalesStatus");
ALTER TABLE "OffPjpAttendance"
 ADD COLUMN "manualSalesMode" TEXT NOT NULL DEFAULT 'NOTES_ONLY',
 ADD COLUMN "manualSalesStatus" TEXT NOT NULL DEFAULT 'NOTES_ONLY',
 ADD COLUMN "isManualSalesApproved" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "manualSalesReviewedBy" TEXT,
 ADD COLUMN "manualSalesReviewedAt" TIMESTAMP(3),
 ADD COLUMN "manualSalesReviewNote" TEXT;
CREATE INDEX "OffPjpAttendance_manualSalesStatus_idx" ON "OffPjpAttendance"("manualSalesStatus");
