/**
 * Date Utils
 * Single Responsibility: Helper tanggal & hari berbahasa Indonesia untuk filter jadwal.
 */

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Nama hari ini dalam Bahasa Indonesia, mis. "Senin" */
export const getTodayNameId = () => DAY_NAMES_ID[new Date().getDay()];

/** Normalisasi dayOfWeek (string | array) → array lowercase ter-trim */
const toDayList = (dayOfWeek) => {
    if (Array.isArray(dayOfWeek)) return dayOfWeek.map((d) => String(d).trim().toLowerCase());
    return [String(dayOfWeek).trim().toLowerCase()];
};

/**
 * Cek apakah satu stop terjadwal hari ini.
 * Stop tanpa dayOfWeek (data live dari PJP harian backend) selalu dianggap hari ini.
 * Mendukung dayOfWeek berupa string ("Senin") atau array (["Senin","Sabtu"]).
 */
export const isStopScheduledToday = (stop) => {
    if (!stop || stop.dayOfWeek == null || stop.dayOfWeek === '') return true;
    const todayName = getTodayNameId().toLowerCase();
    return toDayList(stop.dayOfWeek).includes(todayName);
};

/**
 * Filter stops ke jadwal hari ini saja.
 * Stop tanpa dayOfWeek (data live dari PJP harian backend) selalu lolos.
 * Case-insensitive, toleran spasi, mendukung array multi-hari.
 */
export const filterStopsForToday = (stops = []) => stops.filter(isStopScheduledToday);
