ALTER TABLE "User" ADD COLUMN "supervisorId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "User_supervisorId_idx" ON "User"("supervisorId");
UPDATE "User" u SET "supervisorId" = c."supervisorId" FROM "Cluster" c WHERE u.role = 'SALES' AND u."clusterId" = c.id AND c."deletedAt" IS NULL;
UPDATE "User" u SET "supervisorId" = candidates.spv FROM (SELECT "assignedSalesId" AS sales, min("supervisorId") AS spv FROM "Cluster" WHERE "deletedAt" IS NULL AND "supervisorId" IS NOT NULL GROUP BY "assignedSalesId" HAVING count(DISTINCT "supervisorId") = 1) candidates WHERE u.id = candidates.sales AND u.role = 'SALES' AND u."supervisorId" IS NULL;
