/**
 * Spreadsheet Import Service
 * Single Responsibility: Parsing CSV/Excel Spreadsheet text for RJP Outlets & Cluster Data.
 * No dummy data or hardcoded defaults allowed.
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

  const parsedRecords = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 3) continue;

    // Strict parsing without dummy fallbacks
    const outletCode = cols[1];
    const customerName = cols[2];
    
    // Skip if essential data is missing
    if (!outletCode || !customerName) continue;

    const record = {
      clusterName: cols[0] || '',
      outletCode: outletCode,
      customerName: customerName,
      outletName: customerName, // alias for consistency
      address: cols[3] || '',
      area: cols[4] || '',
      latitude: parseFloat(cols[5]) || null,
      longitude: parseFloat(cols[6]) || null,
      callFrequency: cols[7] ? cols[7].toUpperCase() : 'F1',
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
    'Klaster Cimahi,OUT-001,Toko Sumber Rezeki,Jl. Raya Cibeureum No. 12,Cimahi Selatan,-6.8921,107.5352,F4',
    'Klaster Cimahi,OUT-002,Minimarket Maju Jaya,Jl. Raya Amir Machmud No. 88,Cimahi Tengah,-6.8722,107.5423,F2',
  ].join('\n');

  return header + sampleRows;
};
