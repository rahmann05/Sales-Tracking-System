import React from 'react';
import { LuBell, LuUser, LuSearch, LuLogOut, LuTrendingUp } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { StatusMonitor } from '../common/StatusMonitor';
import '../../styles/layout/Header.css';

/**
 * Header Layout Component (Desktop Only Top Bar with Integrated KPI Overview Stats)
 */
export const Header = ({ searchQuery, setSearchQuery, onLogout, totalVisits = 142, completionRate = 84 }) => {
  return (
    <header className="header-container">
      {/* Left: Search Input Bar */}
      <div className="w-64 xl:w-80">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search routes, reps..."
          icon={LuSearch}
        />
      </div>

      {/* Middle: Integrated Top Navbar KPI Stats (Total Visits & Completion) */}
      <div className="hidden lg:flex items-center gap-3 bg-surface-container-low/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border-glass">
        {/* Total Visits Pill */}
        <div className="flex items-center gap-2.5 pr-4 border-r border-border-glass">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            <LuTrendingUp />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Visits</span>
              <span className="text-[10px] font-extrabold bg-secondary-container/40 text-[#3c4d00] px-1.5 py-0.5 rounded-full">
                +12%
              </span>
            </div>
            <span className="text-sm font-extrabold text-on-surface">{totalVisits}</span>
          </div>
        </div>

        {/* Completion Rate Pill */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center text-sm font-bold">
            <FiCheckCircle />
          </div>
          <div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block leading-none">Completion</span>
            <span className="text-sm font-extrabold text-on-surface">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Right Header Controls */}
      <div className="header-controls">
        {/* Class Component: StatusMonitor */}
        <StatusMonitor label="WIB" />

        {/* Notifications Icon Button */}
        <div className="relative">
          <Button
            variant="icon"
            icon={LuBell}
            onClick={() => alert('No new notifications')}
          />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </div>

        {/* User Profile Badge */}
        <div className="header-user-badge" onClick={onLogout} title="Klik untuk Keluar (Logout)">
          <span className="header-user-title">
            Executive Admin
          </span>
          <div className="header-user-avatar">
            <LuUser />
          </div>
          <LuLogOut className="text-on-surface-variant text-sm ml-1" />
        </div>
      </div>
    </header>
  );
};
