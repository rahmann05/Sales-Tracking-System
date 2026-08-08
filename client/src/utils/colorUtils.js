/**
 * Color Utils
 * Single Responsibility: Pure helper untuk manipulasi warna hex.
 * 1 File = 1 Pure Utility
 */

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

const hexToRgb = (hex) => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const rgbToHex = ({ r, g, b }) =>
    `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`;

/**
 * Hasilkan tone berbeda dari warna dasar cluster.
 * @param {string} baseHex - Warna dasar cluster (mis. '#2563eb')
 * @param {number} index - Index leg (0 = tergelap/utama)
 * @param {number} totalLegs - Total leg untuk distribusi tone
 * @returns {string} Hex tone warna
 */
export const getClusterTone = (baseHex, index, totalLegs) => {
    const { r, g, b } = hexToRgb(baseHex);
    const total = Math.max(totalLegs, 1);

    // Leg 0 = 100% base (pekat); makin besar index makin terang (maks 65% menuju putih)
    const lightenRatio = Math.min(0.65 * (index / total), 0.65);
    const lighten = (channel) => channel + (255 - channel) * lightenRatio;

    return rgbToHex({ r: lighten(r), g: lighten(g), b: lighten(b) });
};
