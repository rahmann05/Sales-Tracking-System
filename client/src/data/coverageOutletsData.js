/**
 * 400 Coverage Outlets Dataset
 * Single Responsibility: Master Database for 400 Outlets across Kota Cimahi & Kab. Bandung Barat.
 * 1 File = 1 Data Module
 */

const OUTLET_NAMES_PREFIX = ['Toko', 'Warung', 'Grosir', 'Minimarket', 'Agen'];
const OWNER_NAMES = ['Hj. Aminah', 'Pak Koes', 'Ibu Susanti', 'Bpk. Hendro', 'H. Rohmat', 'Ibu Erna', 'Bpk. Mulyadi', 'Teh Rina', 'Kang Asep', 'Ibu Lilis'];

/**
 * Generates 400 mock coverage outlets distributed across the 5 main clusters.
 */
const generateOutlets = () => {
  const clusters = [
    { clusterId: 'cluster-cmi-selatan', name: 'Klaster Cimahi Selatan & Leuwigajah', count: 85, baseLat: -6.892, baseLng: 107.535, area: 'Cimahi Selatan' },
    { clusterId: 'cluster-cmi-tengah-utara', name: 'Klaster Cimahi Tengah & Utara', count: 95, baseLat: -6.872, baseLng: 107.542, area: 'Cimahi Tengah' },
    { clusterId: 'cluster-pdl-ngamprah', name: 'Klaster Padalarang & Ngamprah', count: 80, baseLat: -6.837, baseLng: 107.476, area: 'Padalarang' },
    { clusterId: 'cluster-btj-cililin', name: 'Klaster Batujajar & Cililin', count: 75, baseLat: -6.897, baseLng: 107.502, area: 'Batujajar' },
    { clusterId: 'cluster-lmb-parongpong', name: 'Klaster Lembang & Parongpong', count: 65, baseLat: -6.814, baseLng: 107.614, area: 'Lembang' },
  ];

  const outlets = [];
  let idCounter = 1;

  clusters.forEach((cluster) => {
    for (let i = 1; i <= cluster.count; i++) {
      const idStr = String(idCounter).padStart(3, '0');
      const prefix = OUTLET_NAMES_PREFIX[idCounter % OUTLET_NAMES_PREFIX.length];
      const owner = OWNER_NAMES[idCounter % OWNER_NAMES.length];
      const freq = idCounter % 5 === 0 ? 'F4' : idCounter % 2 === 0 ? 'F2' : 'F1';
      
      // small geospatial jitter around cluster center
      const latJitter = ((i % 10) - 5) * 0.003;
      const lngJitter = (((i * 3) % 10) - 5) * 0.003;

      outlets.push({
        id: `OUT-${idStr}`,
        outletCode: `OUT-${idStr}`,
        customerName: `${prefix} Berkah ${cluster.area} ${i}`,
        outletName: `${prefix} Berkah ${cluster.area} ${i}`,
        owner,
        phone: `0812-${String(1000 + idCounter).slice(0, 4)}-${String(5000 + idCounter).slice(0, 4)}`,
        address: `Jl. Raya ${cluster.area} No. ${i * 2}`,
        area: cluster.area,
        clusterId: cluster.clusterId,
        clusterName: cluster.name,
        latitude: parseFloat((cluster.baseLat + latJitter).toFixed(4)),
        longitude: parseFloat((cluster.baseLng + lngJitter).toFixed(4)),
        radiusMeters: 50,
        callFrequency: freq,
        creditLimit: freq === 'F4' ? 30000000 : freq === 'F2' ? 15000000 : 5000000,
        outstanding: freq === 'F4' ? 5000000 : 1000000,
        status: 'ACTIVE',
      });
      idCounter++;
    }
  });

  return outlets;
};

export const MASTER_COVERAGE_OUTLETS = generateOutlets();
