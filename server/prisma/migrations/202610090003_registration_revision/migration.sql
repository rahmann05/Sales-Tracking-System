ALTER TABLE "CustomerRegistration"
 ADD COLUMN "revisionHistory" JSONB,
 ADD COLUMN "visitIntervalWeeks" INTEGER,
 ADD COLUMN "locationEvidence" JSONB;
ALTER TABLE "CustomerRegistration" ALTER COLUMN "latitude" DROP DEFAULT;
ALTER TABLE "CustomerRegistration" ALTER COLUMN "longitude" DROP DEFAULT;
ALTER TABLE "CustomerRegistration" ADD CONSTRAINT "CustomerRegistration_visitIntervalWeeks_check" CHECK ("visitIntervalWeeks" IN (1,2,4));
