/**
 * Spreadsheet Import Service
 * Single Responsibility: Parsing CSV/Excel Spreadsheet text for RJP Outlets & Cluster Data.
 * 1 File = 1 Pure Logic Service
 */

/**
 * Parses raw CSV string into an array of outlet objects.
 * Expects CSV format with headers:
 * ClusterName,OutletCode,CustomerName,Address,Area,Lat,Lng,Frequency
 */
export const parseSpreadsheetCsv = (csvText = '') => {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const parsedRecords = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 3) continue;

    const record = {
      id: `IMP-${Date.now()}-${i}`,
      clusterName: cols[0] || 'Klaster Cimahi Tengah & Utara',
      outletCode: cols[1] || `OUT-IMP-${i}`,
      customerName: cols[2] || `Toko Impor ${i}`,
      outletName: cols[2] || `Toko Impor ${i}`,
      address: cols[3] || 'Jl. Raya Bandung Barat',
      area: cols[4] || 'Cimahi',
      latitude: parseFloat(cols[5]) || -6.8722,
      longitude: parseFloat(cols[6]) || 107.5423,
      callFrequency: (cols[7] || 'F2').toUpperCase(),
      radiusMeters: 50,
      status: 'ACTIVE',
    };

    parsedRecords.push(record);
  }

  return parsedRecords;
};

/**
 * Generates sample CSV template content for download.
 */
export const generateCsvTemplateContent = () => {
  const header = 'ClusterName,OutletCode,CustomerName,Address,Area,Lat,Lng,Frequency\n';
  const sampleRows = [
    'Klaster Cimahi Selatan & Leuwigajah,OUT-001,Toko Sumber Rezeki,Jl. Raya Cibeureum No. 12,Cimahi Selatan,-6.8921,107.5352,F4',
    'Klaster Cimahi Tengah & Utara,OUT-002,Minimarket Maju Jaya,Jl. Raya Amir Machmud No. 88,Cimahi Tengah,-6.8722,107.5423,F2',
    'Klaster Padalarang & Ngamprah,OUT-003,Grosir Sinar Abadi,Jl. Raya Padalarang No. 45,Padalarang,-6.8375,107.4764,F4',
    'Klaster Lembang & Parongpong,OUT-004,Toko Kelontong Berkah,Jl. Raya Lembang No. 10,Lembang,-6.8142,107.6144,F1',
  ].join('\n');

  return header + sampleRows;
};
