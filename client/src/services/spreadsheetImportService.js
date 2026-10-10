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
export const spreadsheetFields = ['ClusterCode','ClusterName','OutletCode','CustomerName','Address','Area','Lat','Lng','Frequency'];
export const readSpreadsheetRecords = (csvText = '') => {
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
  const headers=(records[0]||[]).map(h=>h.replace(/^\uFEFF/,'').trim());
  if(headers.some(h=>!h))throw new Error('Header CSV tidak boleh kosong');
  if(new Set(headers).size!==headers.length)throw new Error('Header CSV duplikat');
  return {headers,records:records.slice(1)};
};
export const parseSpreadsheetCsv = (csvText = '', mapping = {}) => {
  if(!csvText)return [];
  const {headers,records}=readSpreadsheetRecords(csvText),required=['ClusterName','OutletCode','CustomerName','Address','Area','Lat','Lng'];
  const selected=spreadsheetFields.map(h=>mapping[h]??h).filter(h=>headers.includes(h));
  if(new Set(selected).size!==selected.length)throw new Error('Satu kolom sumber tidak boleh dipakai untuk beberapa field');
  const positions=Object.fromEntries(spreadsheetFields.map(h=>[h,headers.indexOf(mapping[h]??h)]).filter(([,i])=>i>=0));
  if(required.some(h=>positions[h]===undefined))throw new Error('Header CSV wajib: '+required.join(', '));
  if(new Set(headers).size!==headers.length)throw new Error('Header CSV duplikat');
  const parsedRecords=records.map((source,i)=>{
    const cols=[...required,'Frequency'].map(h=>source[positions[h]]??'');
    if(required.some(h=>source[positions[h]]===undefined))throw new Error(`Baris ${i+2}: kolom belum lengkap`);
    const latitude=cols[5]===''?null:Number(cols[5]);const longitude=cols[6]===''?null:Number(cols[6]);
    if(latitude===null||longitude===null||!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error(`Baris ${i+2}: koordinat wajib berupa angka`);
    if(latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)throw new Error(`Baris ${i+2}: koordinat di luar rentang`);
    if(cols[7]&&!['F1','F2','F4'].includes(cols[7].toUpperCase()))throw new Error(`Baris ${i+2}: frekuensi harus F1/F2/F4`);
    return {clusterCode:positions.ClusterCode===undefined?undefined:source[positions.ClusterCode],clusterName:cols[0],outletCode:cols[1],customerName:cols[2],outletName:cols[2],address:cols[3],area:cols[4],latitude,longitude,callFrequency:cols[7]?cols[7].toUpperCase():undefined};
  });
  return parsedRecords;
};

/**
 * Generates sample CSV template content for download.
 */
export const generateCsvTemplateContent = () => {
  const header = 'ClusterCode,ClusterName,OutletCode,CustomerName,Address,Area,Lat,Lng,Frequency\n';
  const sampleRows = [
    ',Klaster Cimahi,OUT-001,Toko Sumber Rezeki,Jl. Raya Cibeureum No. 12,Cimahi Selatan,-6.8921,107.5352,F4',
    ',Klaster Cimahi,OUT-002,Minimarket Maju Jaya,Jl. Raya Amir Machmud No. 88,Cimahi Tengah,-6.8722,107.5423,F2',
  ].join('\n');

  return header + sampleRows;
};
