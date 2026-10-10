CREATE INDEX "Outlet_google_location_expiry_idx" ON "Outlet" (("googleLocation"->>'expiresAt')) WHERE "googleLocation"->>'status'='ACTIVE';
CREATE INDEX "Outlet_google_location_refresh_idx" ON "Outlet" (("googleLocation"->>'nextRefreshAt')) WHERE "googleLocation"->>'status'='ACTIVE';
