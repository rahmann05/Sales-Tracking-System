CREATE TABLE "SalesLivePosition" (
 "userId" TEXT NOT NULL,
 "latitude" DOUBLE PRECISION NOT NULL,
 "longitude" DOUBLE PRECISION NOT NULL,
 "accuracy" DOUBLE PRECISION,
 "speed" DOUBLE PRECISION,
 "heading" DOUBLE PRECISION,
 "battery" DOUBLE PRECISION,
 "observedAt" TIMESTAMP(3),
 "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "gpsEvidence" JSONB NOT NULL,
 "breadcrumbs" JSONB NOT NULL DEFAULT '[]',
 CONSTRAINT "SalesLivePosition_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX "SalesLivePosition_receivedAt_idx" ON "SalesLivePosition"("receivedAt");
ALTER TABLE "SalesLivePosition" ADD CONSTRAINT "SalesLivePosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
