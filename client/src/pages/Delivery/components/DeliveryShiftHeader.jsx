import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuTruck, LuUserCheck, LuClock, LuCamera } from 'react-icons/lu';
import { Avatar } from '../../../components/common/Avatar';

export const DeliveryShiftHeader = () => {
  const { user, shiftAttendance, handleShiftClockIn, handleShiftClockOut } = useApp();

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={user.avatar} name={user.name} size="lg" className="rounded-2xl ring-2 ring-blue-500/30" />
          <span className="absolute -bottom-1 -right-1 bg-blue-500 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center text-[10px] text-white">
            <LuTruck />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{user.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
              {user.roleLabel}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Armada Truk: <span className="font-bold text-on-surface">{user.vehiclePlate || 'B 9421 SF'}</span> • Crew: Driver + Helper ({user.helperName || user.driverName || 'Rian Putra'})
          </p>
        </div>
      </div>

      {/* Shift Clock In / Out Widget */}
      <div className="flex items-center gap-3 bg-surface-variant/40 p-3 rounded-xl border border-border-glass">
        <div className="text-right">
          <p className="text-xs text-on-surface-variant font-medium">Shift Gudang & Delivery</p>
          <p className={`text-xs font-bold ${shiftAttendance.clockedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
            {shiftAttendance.clockedIn ? `Aktif sejak ${shiftAttendance.clockInTime}` : 'Belum Absen Shift'}
          </p>
        </div>
        {!shiftAttendance.clockedIn ? (
          <button
            onClick={handleShiftClockIn}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <LuCamera className="text-base" />
            <span>Clock In Gudang</span>
          </button>
        ) : (
          <button
            onClick={handleShiftClockOut}
            className="px-3 py-2 bg-surface border border-border-glass text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-variant transition-all flex items-center gap-1.5"
          >
            <LuClock className="text-base text-on-surface-variant" />
            <span>Clock Out</span>
          </button>
        )}
      </div>
    </div>
  );
};
