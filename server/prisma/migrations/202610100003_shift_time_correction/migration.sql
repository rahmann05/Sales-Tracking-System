-- Administrative corrections do not overwrite timestamps received by the server.
ALTER TABLE "StaffActivity" ADD COLUMN "timeCorrection" JSONB;
