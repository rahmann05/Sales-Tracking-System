-- Execute only after a clean preflight and review of native coordinate pairs.
-- Validates existing rows without filling in or removing any coordinates.
ALTER TABLE "Outlet" VALIDATE CONSTRAINT "Outlet_coordinate_pair";
