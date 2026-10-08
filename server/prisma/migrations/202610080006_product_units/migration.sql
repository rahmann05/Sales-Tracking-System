ALTER TABLE "Product" ADD COLUMN "unit" TEXT, ADD COLUMN "baseUnit" TEXT, ADD COLUMN "unitsPerUnit" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "baseUnit" TEXT, ADD COLUMN "unitsPerUnit" INTEGER;
ALTER TABLE "Product" ADD CONSTRAINT "Product_unit_definition" CHECK (
 ("unit" IS NULL AND "baseUnit" IS NULL AND "unitsPerUnit" IS NULL) OR
 ("unit" IS NOT NULL AND length(trim("unit")) BETWEEN 1 AND 32 AND "baseUnit" IS NOT NULL AND length(trim("baseUnit")) BETWEEN 1 AND 32 AND "unitsPerUnit" IS NOT NULL AND "unitsPerUnit" BETWEEN 1 AND 1000000 AND (lower(trim("unit")) <> lower(trim("baseUnit")) OR "unitsPerUnit" = 1))
);
