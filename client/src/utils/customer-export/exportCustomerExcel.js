import {ND6_COMPANY_ID, ND6_BRANCH_ID, ND6_DIVISION_ID} from './helpers';
import {downloadOperationalFile, assertExportAllowed} from '../../services/operationalExportService';

export async function exportCustomerExcel(data = [], filename = 'IMPORT_CUSTOMER_ND6_MASTER.xlsx') {
  if (!data.length) throw new Error('Tidak ada data registrasi customer untuk diekspor.');
  await assertExportAllowed('OUTLET');
  const {default: ExcelJS} = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(now).replaceAll('-','');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  const timeVal = (Number(parts.hour)*3600+Number(parts.minute)*60+Number(parts.second))/86400;
  const nd6 = workbook.addWorksheet('IMPORT_ND6_CUSTOMER');
  nd6.addRow(['ND6DATA','DocumentStart',dateStr,timeVal.toFixed(15),'ADMIN']);
  for (const [key,value] of [['companyID',ND6_COMPANY_ID],['branchID',ND6_BRANCH_ID],['divisionID',ND6_DIVISION_ID]]) nd6.addRow(['ND6DATA','DocumentCheck',key,value,'End']);
  const nd6Headers = ['ND6DATA', 'customermaster', 'attribute', 'companyID', 'branchID', 'customerID', 'customerName', 'customerAddress1', 'customerAddress2', 'customerAddress3', 'customerCity', 'customerPhone', 'customerFax', 'customerPostal', 'customerOwner', 'customerTaxAddress', 'customerContactPerson', 'customerTaxNumber', 'customerArea', 'customerSubArea', 'customerMarketSegment', 'customerChannel', 'customerSubChannel', 'customerGroup', 'customerSubGroup', 'customerStoreStatus', 'customerSalesman', 'customerPaymentTerm', 'customerChannelTier', 'isCash', 'isCredit', 'creditLimit', 'creditLimitDays', 'priceType', 'discountType', 'isTaxable', 'isActive', 'isBUMN', 'isContraBill', 'End'];
  nd6.addRow(nd6Headers);
  for (const d of data) {
    const custCode = d.customerCode || d.outletCode || '';
    const custName = (d.name || '').toUpperCase();
    const address1 = (d.address || '').toUpperCase();
    const address2 = (d.address2 || '').toUpperCase();
    const address3 = (d.address3 || '').toUpperCase();
    const city = (d.city || '').toUpperCase();
    const phone = (d.phone || '').replace(/[^0-9]/g, '') || '';
    const owner = (d.ownerName || d.taxName || custName).toUpperCase();
    const taxAddress = (d.taxAddress || address1).toUpperCase();
    const npwp = d.taxNumber || '';
    const area = d.area || '';
    const subArea = d.subAreaKecamatan ? `${area}${d.subAreaKecamatan.substring(0, 3).toUpperCase()}` : '';
    const channel = d.channel === 'MODERN_TRADE' ? 'MT' : 'GT';
    const subChannel = d.subChannel || 'RTL';
    const topDays = d.termOfPaymentDays || 0;
    const rowValues = ['ND6DATA', 'customermaster', 'value', ND6_COMPANY_ID, ND6_BRANCH_ID, custCode, custName, address1, address2, address3, city, phone, '0', '0', owner, taxAddress, '', npwp, area, subArea, 'MS0000', channel, subChannel, '-', '-', 'SS0000', 'SL0000', topDays || '0', d.channelTier || 'A', d.paymentType === 'CASH' ? 'Y' : 'N', d.paymentType !== 'CASH' ? 'Y' : 'N', '0', '0', '0', '0', d.taxType === 'PKP' ? 'Y' : 'N', d.isActive !== false ? 'Y' : 'N', d.isBumn ? 'Y' : 'N', d.isContraBill !== false ? 'Y' : 'N', 'End'];
    nd6.addRow(rowValues);
  }
  nd6.addRow(['ND6DATA','DocumentEnd',dateStr,String(data.length),'End']);
  const recap = workbook.addWorksheet('REKAP_REGISTRASI_LENGKAP');
  const executiveHeaders = ['No', 'Kode Outlet', 'Nama Toko', 'Nama Pemilik', 'Alamat Toko', 'Kota', 'Kecamatan', 'No Telepon', 'Divisi', 'Area', 'Channel', 'Sub Channel', 'Tiering', 'Pajak (Tax)', 'NPWP / NIK', 'Nama Pajak', 'Alamat Pajak', 'Tipe Pembayaran', 'TOP (Hari)', 'Jadwal RJP', 'Hari Kunjungan', 'Salesman', 'Supervisor', 'Status Approval', 'Tgl Pengajuan', 'Latitude', 'Longitude'];
  recap.addRow(executiveHeaders);
  data.forEach((d,idx)=>{
    const dateFormatted = d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '-';
    const execCols = [idx + 1, d.customerCode || '-', d.name || '', d.ownerName || '-', d.address || '', d.city || '', d.subAreaKecamatan || '-', d.phone || '-', d.division || '', d.area || '', d.channel || 'GT', d.subChannel || 'RTL', d.channelTier || 'A', d.taxType || 'NON_PKP', d.taxNumber || '-', d.taxName || d.ownerName || '-', d.taxAddress || d.address || '-', d.paymentType || 'CASH', d.termOfPaymentDays || 0, d.visitWeekSchedule || 'ALL_WEEK', d.visitDays || '-', d.salesmanName || '-', d.spvName || '-', d.registrationStatus || '-', dateFormatted, d.latitude ?? '', d.longitude ?? ''];
    recap.addRow(execCols);
  });
  for (const sheet of workbook.worksheets) {
    sheet.columns.forEach(c=>{c.width=22;});
    sheet.eachRow(row=>{row.eachCell(cell=>{cell.font={name:'Calibri',size:10};cell.alignment={wrapText:true,vertical:'middle'};});});
  }
  const buffer = await workbook.xlsx.writeBuffer();
  await downloadOperationalFile(buffer,filename.replace(/\.(xls|xlsx)$/i,'')+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','OUTLET');
  return buffer;
}
