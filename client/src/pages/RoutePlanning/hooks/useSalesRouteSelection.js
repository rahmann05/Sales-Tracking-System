import { useState, useMemo } from 'react';

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const getTodayDayName = () => {
    const dayIdx = new Date().getDay();
    return dayIdx === 0 ? 'Senin' : INDO_DAYS[dayIdx];
};

const FALLBACK_SCHEDULE_INFO = {
    clusterName: '-',
    outletsCount: 0,
    subDistrict: '-',
};

/**
 * useSalesRouteSelection Hook
 * Single Responsibility: Kelola seleksi sales & hari aktif untuk tab pratinjau rute,
 * serta memfilter stops harian sesuai sales & hari terpilih.
 */
export const useSalesRouteSelection = ({ user, matrixRows = [], salesStops = [] }) => {
    const isSales = user?.role === 'SALES';
    const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
    const [selectedDay, setSelectedDay] = useState(getTodayDayName());

    const currentSalesRow = useMemo(() => {
        if (isSales) {
            const clusterName = salesStops[0]?.clusterName || user?.cluster?.name || '';
            const spvName = salesStops[0]?.supervisorName || '';
            return {
                salesId: user?.id || '',
                salesName: user?.name || '',
                spvName: spvName || '-',
                clusterName: clusterName || '-',
            };
        }

        if (selectedSalesPerson) {
            const found = matrixRows.find(
                (r) => r.salesId === selectedSalesPerson.salesId || r.salesName === selectedSalesPerson.salesName
            );
            if (found) return found;
        }

        const userMatch = matrixRows.find(
            (r) => r.salesName?.toLowerCase() === user?.name?.toLowerCase() || r.salesId === user?.id
        );
        return userMatch || matrixRows[0] || null;
    }, [matrixRows, selectedSalesPerson, user, isSales, salesStops]);

    const dailyScheduleInfo = useMemo(() => {
        if (isSales && salesStops.length > 0) {
            return {
                clusterName: salesStops[0]?.clusterName || user?.cluster?.name || '-',
                outletsCount: salesStops.length,
                subDistrict: salesStops[0]?.subDistrict || salesStops[0]?.regionName || '-',
            };
        }
        return currentSalesRow?.schedule?.[selectedDay] || FALLBACK_SCHEDULE_INFO;
    }, [currentSalesRow, selectedDay, isSales, salesStops, user]);

    const filteredDailyStops = useMemo(() => {
        if (isSales && salesStops.length > 0) {
            return salesStops;
        }

        const matched = salesStops.filter((stop) => {
            const matchSales = !stop.assignedSalesName || stop.assignedSalesName === currentSalesRow?.salesName;
            const matchDay = !stop.dayOfWeek || stop.dayOfWeek === selectedDay;
            return matchSales && matchDay;
        });
        if (matched.length > 0) return matched;

        const byDay = salesStops.filter((s) => s.dayOfWeek === selectedDay);
        if (byDay.length > 0) return byDay;

        return salesStops.slice(0, 10);
    }, [salesStops, currentSalesRow, selectedDay, isSales]);

    return {
        selectedSalesPerson,
        setSelectedSalesPerson,
        selectedDay,
        setSelectedDay,
        currentSalesRow,
        dailyScheduleInfo,
        filteredDailyStops,
    };
};
