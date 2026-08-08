import React from 'react';
import { SalesDailyRouteSummaryCard } from './sales/SalesDailyRouteSummaryCard';
import { SalesRollingScheduleView } from './sales/SalesRollingScheduleView';

/**
 * SalesViewTab Component
 * Single Responsibility: Konten tab pratinjau rute sales harian & jadwal rolling mingguan.
 */
export const SalesViewTab = ({
    currentSalesRow,
    selectedDay,
    onSelectDay,
    dailyScheduleInfo,
    filteredDailyStops,
    matrixRows,
    onSelectSales,
    canSwitchSales,
}) => (
    <div className="space-y-6">
        <SalesDailyRouteSummaryCard
            salesPerson={currentSalesRow}
            supervisorName={currentSalesRow?.spvName || 'Ahmad Subagja'}
            activeRoute={{ day: selectedDay, name: dailyScheduleInfo.clusterName }}
            stops={filteredDailyStops}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            salesList={matrixRows}
            onSelectSales={onSelectSales}
            canSwitchSales={canSwitchSales}
        />
        <SalesRollingScheduleView
            userSchedule={currentSalesRow?.schedule || {}}
            todayDay={selectedDay}
            onSelectDay={onSelectDay}
            salesName={currentSalesRow?.salesName}
        />
    </div>
);
