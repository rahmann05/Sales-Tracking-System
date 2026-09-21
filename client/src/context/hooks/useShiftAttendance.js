import { useState } from 'react';

/**
 * useShiftAttendance - Shift clock-in/out state.
 * Single Responsibility: owns the daily shift attendance slice
 * and its clock-in / clock-out transitions.
 */
export const useShiftAttendance = () => {
  const [shiftAttendance, setShiftAttendance] = useState({
    clockedIn: false,
    clockInTime: null,
    clockOutTime: null,
    photoUrl: null,
  });

  const handleShiftClockIn = (photoUrl) => {
    setShiftAttendance({
      clockedIn: true,
      clockInTime: new Date().toLocaleTimeString(),
      clockOutTime: null,
      photoUrl,
    });
  };

  const handleShiftClockOut = () => {
    setShiftAttendance((prev) => ({
      ...prev,
      clockedIn: false,
      clockOutTime: new Date().toLocaleTimeString(),
    }));
  };

  return { shiftAttendance, handleShiftClockIn, handleShiftClockOut };
};
