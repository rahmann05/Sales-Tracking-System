CREATE UNIQUE INDEX "Attendance_pjpStopId_userId_type_key" ON "Attendance" ("pjpStopId","userId","type");
CREATE UNIQUE INDEX "DeliveryAttendance_deliveryStopId_driverId_type_key" ON "DeliveryAttendance" ("deliveryStopId","driverId","type");
