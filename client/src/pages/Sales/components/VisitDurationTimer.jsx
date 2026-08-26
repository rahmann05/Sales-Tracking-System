import React, { useState, useEffect } from 'react';
import { LuClock, LuShieldAlert, LuCircleCheck } from 'react-icons/lu';

/**
 * VisitDurationTimer Component
 * Single Responsibility: Live elapsed timer & visual countdown bar for minimum visit duration (5 minutes).
 */
export const VisitDurationTimer = ({ startTime, minMinutes = 5 }) => {
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    // If no valid startTime provided, use component mount time as fallback
    const startMs = startTime ? new Date(startTime).getTime() : Date.now();

    const updateTimer = () => {
      const diffMs = Math.max(0, Date.now() - startMs);
      setElapsedSecs(Math.floor(diffMs / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const targetSecs = minMinutes * 60;
  const isMinDurationMet = elapsedSecs >= targetSecs;
  const remainingSecs = Math.max(0, targetSecs - elapsedSecs);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round((elapsedSecs / targetSecs) * 100));

  return (
    <div className="p-3 bg-surface-container rounded-2xl border border-border-glass space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-on-surface">
          <LuClock className="text-primary animate-pulse" />
          <span>Durasi Kunjungan:</span>
          <span className="font-mono text-sm text-primary font-black">
            {formatTime(elapsedSecs)}
          </span>
        </div>
        <span
          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isMinDurationMet
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
          }`}
        >
          {isMinDurationMet ? (
            <>
              <LuCircleCheck /> Standar Kunjungan Terpenuhi
            </>
          ) : (
            <>
              <LuShieldAlert /> Min. {minMinutes} Menit (Sisa {formatTime(remainingSecs)})
            </>
          )}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-variant/40 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isMinDurationMet ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

