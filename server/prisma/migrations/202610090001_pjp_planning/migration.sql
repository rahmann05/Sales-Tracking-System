CREATE TABLE "PjpPlan" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "requestId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "supervisorId" TEXT NOT NULL,
 "startsOn" TEXT NOT NULL,
 "endsOn" TEXT NOT NULL,
 "rules" JSONB NOT NULL,
 "revision" INTEGER NOT NULL DEFAULT 1,
 "status" TEXT NOT NULL DEFAULT 'DRAFT',
 "history" JSONB NOT NULL DEFAULT '[]',
 "createdBy" TEXT NOT NULL,
 "updatedBy" TEXT NOT NULL,
 "publishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "PjpPlan_requestId_key" ON "PjpPlan"("requestId");
CREATE INDEX "PjpPlan_supervisorId_startsOn_idx" ON "PjpPlan"("supervisorId", "startsOn");
