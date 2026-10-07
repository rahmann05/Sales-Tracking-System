import { buildCustomerWorkbook } from './buildCustomerWorkbook';
import { ND6_COMPANY_ID, ND6_BRANCH_ID, ND6_DIVISION_ID, escapeXml, downloadBlob } from "./helpers";
export const exportCustomerExcel = (data = [], filename = 'IMPORT_CUSTOMER_ND6_MASTER.xls') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeVal = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
  const nd6Headers = ['ND6DATA', 'customermaster', 'attribute', 'companyID', 'branchID', 'customerID', 'customerName', 'customerAddress1', 'customerAddress2', 'customerAddress3', 'customerCity', 'customerPhone', 'customerFax', 'customerPostal', 'customerOwner', 'customerTaxAddress', 'customerContactPerson', 'customerTaxNumber', 'customerArea', 'customerSubArea', 'customerMarketSegment', 'customerChannel', 'customerSubChannel', 'customerGroup', 'customerSubGroup', 'customerStoreStatus', 'customerSalesman', 'customerPaymentTerm', 'customerChannelTier', 'isCash', 'isCredit', 'creditLimit', 'creditLimitDays', 'priceType', 'discountType', 'isTaxable', 'isActive', 'isBUMN', 'isContraBill', 'End'];
  let nd6RowsXml = '';
  nd6RowsXml += `
    <Row ss:Height="20">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentStart</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${dateStr}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${timeVal.toFixed(15)}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ADMIN</Data></Cell>
    </Row>`;
  nd6RowsXml += `
    <Row ss:Height="18">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentCheck</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">companyID</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${ND6_COMPANY_ID}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;
  nd6RowsXml += `
    <Row ss:Height="18">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentCheck</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">branchID</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${ND6_BRANCH_ID}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;
  nd6RowsXml += `
    <Row ss:Height="18">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentCheck</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">divisionID</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${ND6_DIVISION_ID}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;
  nd6RowsXml += `
    <Row ss:Height="24">
      ${nd6Headers.map(h => `<Cell ss:StyleID="HeaderCell"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
    </Row>`;
  data.forEach(d => {
    const custCode = d.customerCode || 'PVC0000';
    const custName = (d.name || '').toUpperCase();
    const address1 = (d.address || '').toUpperCase();
    const address2 = (d.address2 || '').toUpperCase();
    const address3 = (d.address3 || '').toUpperCase();
    const city = (d.city || 'CIMAHI').toUpperCase();
    const phone = (d.phone || '0').replace(/[^0-9]/g, '') || '0';
    const owner = (d.ownerName || d.taxName || custName).toUpperCase();
    const taxAddress = (d.taxAddress || address1).toUpperCase();
    const npwp = d.taxNumber || '00.000.000.0-000.000';
    const area = d.area || 'CMH';
    const subArea = d.subAreaKecamatan ? `${area}${d.subAreaKecamatan.substring(0, 3).toUpperCase()}` : 'CMH007';
    const channel = d.channel === 'MODERN_TRADE' ? 'MT' : 'GT';
    const subChannel = d.subChannel || 'RTL';
    const topDays = d.termOfPaymentDays || 0;
    const rowValues = ['ND6DATA', 'customermaster', 'value', ND6_COMPANY_ID, ND6_BRANCH_ID, custCode, custName, address1, address2, address3, city, phone, '0', '0', owner, taxAddress, '', npwp, area, subArea, 'MS0000', channel, subChannel, '-', '-', 'SS0000', 'SL0000', topDays || '0', d.channelTier || 'A', d.paymentType === 'CASH' ? 'Y' : 'N', d.paymentType !== 'CASH' ? 'Y' : 'N', '0', '0', '0', '0', d.taxType === 'PKP' ? 'Y' : 'N', d.isActive !== false ? 'Y' : 'N', d.isBumn ? 'Y' : 'N', d.isContraBill !== false ? 'Y' : 'N', 'End'];
    nd6RowsXml += `
      <Row ss:Height="20">
        ${rowValues.map((val, idx) => `<Cell ss:StyleID="${idx === 5 || idx === 3 || idx === 4 ? 'YellowCellBold' : 'YellowCell'}"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`).join('')}
      </Row>`;
  });
  nd6RowsXml += `
    <Row ss:Height="20">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentEnd</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${dateStr}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${data.length}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;
  const executiveHeaders = ['No', 'Kode Outlet', 'Nama Toko', 'Nama Pemilik', 'Alamat Toko', 'Kota', 'Kecamatan', 'No Telepon', 'Divisi', 'Area', 'Channel', 'Sub Channel', 'Tiering', 'Pajak (Tax)', 'NPWP / NIK', 'Nama Pajak', 'Alamat Pajak', 'Tipe Pembayaran', 'TOP (Hari)', 'Jadwal RJP', 'Hari Kunjungan', 'Salesman', 'Supervisor', 'Status Approval', 'Tgl Pengajuan', 'Latitude', 'Longitude'];
  let execRowsXml = `
    <Row ss:Height="26">
      ${executiveHeaders.map(h => `<Cell ss:StyleID="ExecHeader"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
    </Row>`;
  data.forEach((d, idx) => {
    const isEven = idx % 2 === 0;
    const styleId = isEven ? 'ExecRowEven' : 'ExecRowOdd';
    const dateFormatted = d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '-';
    const execCols = [idx + 1, d.customerCode || '-', d.name || '', d.ownerName || '-', d.address || '', d.city || 'CIMAHI', d.subAreaKecamatan || '-', d.phone || '-', d.division || 'BELFOODS', d.area || 'CMH', d.channel || 'GT', d.subChannel || 'RTL', d.channelTier || 'A', d.taxType || 'NON_PKP', d.taxNumber || '-', d.taxName || d.ownerName || '-', d.taxAddress || d.address || '-', d.paymentType || 'CASH', d.termOfPaymentDays || 0, d.visitWeekSchedule || 'ALL_WEEK', d.visitDays || '-', d.salesmanName || '-', d.spvName || '-', d.registrationStatus || '-', dateFormatted, d.latitude || 0, d.longitude || 0];
    execRowsXml += `
      <Row ss:Height="20">
        ${execCols.map((c, cIdx) => `<Cell ss:StyleID="${styleId}"><Data ss:Type="${typeof c === 'number' ? 'Number' : 'String'}">${escapeXml(c)}</Data></Cell>`).join('')}
      </Row>`;
  });
  const xmlContent = buildCustomerWorkbook({
    nd6RowsXml,
    execRowsXml,
    now
  });
  downloadBlob(xmlContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
};
