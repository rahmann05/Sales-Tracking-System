import { useState, useMemo } from 'react';

const FALLBACK_SCHEDULE_INFO = {
    clusterName: 'Klaster Cimahi Tengah (RJP-CIMAHI-01)',
    outletsCount: 10,
    subDistrict: 'Cimahi',
};

/**
 * useSalesRouteSelection Hook
 * Single Responsibility: Kelola seleksi sales & hari aktif untuk tab pratinjau rute,
 * serta memfilter stops harian sesuai sales & hari terpilih.
 */
export const useSalesRouteSelection = ({ user, matrixRows, salesStops }) => {
    const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
    const [selectedDay, setSelectedDay] = useState('Senin');

    const currentSalesRow = useMemo(() => {
        if (selectedSalesPerson) {
            const found = matrixRows.find(
                (r) => r.salesId === selectedSalesPerson.salesId || r.salesName === selectedSalesPerson.salesName
            );
            if (found) return found;
        }
        const userMatch = matrixRows.find(
            (r) => r.salesName?.toLowerCase() === user?.name?.toLowerCase() || r.salesId === user?.id
        );
        return userMatch || matrixRows[0];
    }, [matrixRows, selectedSalesPerson, user]);

    const dailyScheduleInfo = useMemo(
        () => currentSalesRow?.schedule?.[selectedDay] || FALLBACK_SCHEDULE_INFO,
        [currentSalesRow, selectedDay]
    );

    const filteredDailyStops = useMemo(() => {
        const matched = salesStops.filter((stop) => {
            const matchSales = !stop.assignedSalesName || stop.assignedSalesName === currentSalesRow?.salesName;
            const matchDay = !stop.dayOfWeek || stop.dayOfWeek === selectedDay;
            return matchSales && matchDay;
        });
        if (matched.length > 0) return matched;

        const byDay = salesStops.filter((s) => s.dayOfWeek === selectedDay);
        if (byDay.length > 0) return byDay;

        return salesStops.slice(0, 10);
    }, [salesStops, currentSalesRow, selectedDay]);

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
