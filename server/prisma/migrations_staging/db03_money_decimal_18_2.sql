-- Staging SQL Migration Script for DB-03 (Monetary Precision Float -> NUMERIC(18,2))
-- Aligned with REVISI 5.docx (INV-04 / DB-03: preserves 100% of existing table & column names).
--
-- RUNBOOK BEFORE EXECUTING IN PRODUCTION:
--   1. Rehearse this script on a staging PostgreSQL snapshot with realistic data.
--   2. Pair this database alteration with updating the 11 corresponding fields in
--      `server/prisma/schema.prisma` from `Float` to `Decimal @db.Decimal(18, 2)`
--      and running `npx prisma generate --schema=server/prisma/schema.prisma`.
--   3. API responses automatically normalize Prisma Decimal objects back into finite
--      JSON numbers via `normalizeDecimalValues()` in `server/src/utils/response.js`.

BEGIN;

ALTER TABLE "Outlet"
  ALTER COLUMN "outstanding" TYPE NUMERIC(18, 2) USING ROUND("outstanding"::numeric, 2);

ALTER TABLE "Attendance"
  ALTER COLUMN "orderAmount" TYPE NUMERIC(18, 2) USING ROUND("orderAmount"::numeric, 2);

ALTER TABLE "OffPjpAttendance"
  ALTER COLUMN "orderAmount" TYPE NUMERIC(18, 2) USING ROUND("orderAmount"::numeric, 2);

ALTER TABLE "Vehicle"
  ALTER COLUMN "fuelPricePerLiter" TYPE NUMERIC(18, 2) USING ROUND("fuelPricePerLiter"::numeric, 2);

ALTER TABLE "VehicleServiceRecord"
  ALTER COLUMN "cost" TYPE NUMERIC(18, 2) USING ROUND("cost"::numeric, 2);

ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE NUMERIC(18, 2) USING ROUND("price"::numeric, 2);

ALTER TABLE "Order"
  ALTER COLUMN "taxAmount" TYPE NUMERIC(18, 2) USING ROUND("taxAmount"::numeric, 2),
  ALTER COLUMN "totalValue" TYPE NUMERIC(18, 2) USING ROUND("totalValue"::numeric, 2);

ALTER TABLE "OrderItem"
  ALTER COLUMN "unitPrice" TYPE NUMERIC(18, 2) USING ROUND("unitPrice"::numeric, 2),
  ALTER COLUMN "subtotal" TYPE NUMERIC(18, 2) USING ROUND("subtotal"::numeric, 2);

ALTER TABLE "Invoice"
  ALTER COLUMN "totalAmount" TYPE NUMERIC(18, 2) USING ROUND("totalAmount"::numeric, 2);

COMMIT;
