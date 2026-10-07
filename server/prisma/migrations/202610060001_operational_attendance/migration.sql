ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "salesProducts" JSONB;
CREATE TABLE IF NOT EXISTS "StaffActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "activityKey" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "outletName" TEXT,
  "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkOutAt" TIMESTAMP(3),
  "notes" TEXT,
  "checklist" JSONB,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "photoUrl" TEXT,
  "lateMinutes" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "StaffActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "StaffActivity_userId_dateKey_activityKey_key" ON "StaffActivity"("userId", "dateKey", "activityKey");
CREATE INDEX IF NOT EXISTS "StaffActivity_dateKey_kind_idx" ON "StaffActivity"("dateKey", "kind");
