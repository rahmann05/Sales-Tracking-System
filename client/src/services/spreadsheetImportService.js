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

  const records=[];let current=[],cell='',quoted=false;
  for(let i=0;i<csvText.length;i++){
    const c=csvText[i];
    if(c==='"'){if(quoted&&csvText[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){current.push(cell.trim());cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csvText[i+1]==='\n')i++;current.push(cell.trim());if(current.some(Boolean))records.push(current);current=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('CSV mengandung tanda kutip yang belum ditutup');
  current.push(cell.trim());if(current.some(Boolean))records.push(current);
  const parsedRecords=records.slice(1).map((cols,i)=>{
    if(cols.length<7)throw new Error(`Baris ${i+2}: kolom belum lengkap`);
    const latitude=cols[5]===''?null:Number(cols[5]);const longitude=cols[6]===''?null:Number(cols[6]);
    if(latitude===null||longitude===null||!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error(`Baris ${i+2}: koordinat wajib berupa angka`);
    return {clusterName:cols[0],outletCode:cols[1],customerName:cols[2],outletName:cols[2],address:cols[3],area:cols[4],latitude,longitude,callFrequency:cols[7]?cols[7].toUpperCase():'F1'};
  });
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
