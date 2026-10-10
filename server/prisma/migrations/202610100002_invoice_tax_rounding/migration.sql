-- Existing commercial documents keep the historical nearest-rupiah calculation.
ALTER TABLE "Invoice" ADD COLUMN "taxRoundingMode" TEXT NOT NULL DEFAULT 'NEAREST';
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_taxRoundingMode_check" CHECK ("taxRoundingMode" IN ('NEAREST', 'DOWN', 'UP'));
