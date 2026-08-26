/**
 * customerExport Utility
 * Single Responsibility: Export customer registration datasets to:
 * 1. Styled Master Excel (XML Spreadsheet 2003 .xls with yellow highlight ala ND6 template)
 * 2. ND6-compatible Data Stream (TXT/Tab-separated)
 * 3. Human-Readable Summary (TXT)
 * 4. Standard CSV format
 */

const ND6_COMPANY_ID = 'NS6083030001545';
const ND6_BRANCH_ID = '1522743351512';
const ND6_DIVISION_ID = '1675645496290';

const escapeXml = (unsafe) => {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * 1. Export to Styled Master Excel (.xls format with Yellow Rows & Clean Grid ala ND6)
 */
export const exportCustomerExcel = (data = [], filename = 'IMPORT_CUSTOMER_ND6_MASTER.xls') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeVal = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;

  // Build Sheet 1: ND6 Master Import Format (Exact Yellow Table from Screenshot)
  const nd6Headers = [
    'ND6DATA',
    'customermaster',
    'attribute',
    'companyID',
    'branchID',
    'customerID',
    'customerName',
    'customerAddress1',
    'customerAddress2',
    'customerAddress3',
    'customerCity',
    'customerPhone',
    'customerFax',
    'customerPostal',
    'customerOwner',
    'customerTaxAddress',
    'customerContactPerson',
    'customerTaxNumber',
    'customerArea',
    'customerSubArea',
    'customerMarketSegment',
    'customerChannel',
    'customerSubChannel',
    'customerGroup',
    'customerSubGroup',
    'customerStoreStatus',
    'customerSalesman',
    'customerPaymentTerm',
    'customerChannelTier',
    'isCash',
    'isCredit',
    'creditLimit',
    'creditLimitDays',
    'priceType',
    'discountType',
    'isTaxable',
    'isActive',
    'isBUMN',
    'isContraBill',
    'End',
  ];

  let nd6RowsXml = '';

  // Metadata Row 1
  nd6RowsXml += `
    <Row ss:Height="20">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentStart</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${dateStr}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${timeVal.toFixed(15)}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ADMIN</Data></Cell>
    </Row>`;

  // Metadata Row 2 (Company ID)
  nd6RowsXml += `
    <Row ss:Height="18">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentCheck</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">companyID</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${ND6_COMPANY_ID}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;

  // Metadata Row 3 (Branch ID)
  nd6RowsXml += `
    <Row ss:Height="18">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentCheck</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">branchID</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${ND6_BRANCH_ID}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;

  // Metadata Row 4 (Division ID)
  nd6RowsXml += `
    <Row ss:Height="18">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentCheck</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">divisionID</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${ND6_DIVISION_ID}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;

  // Column Headers Row (Row 5)
  nd6RowsXml += `
    <Row ss:Height="24">
      ${nd6Headers
        .map(
          (h) =>
            `<Cell ss:StyleID="HeaderCell"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
        )
        .join('')}
    </Row>`;

  // Data Rows (Row 6+ with Solid Yellow Fill #FFFF00)
  data.forEach((d) => {
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
    const subArea = d.subAreaKecamatan
      ? `${area}${d.subAreaKecamatan.substring(0, 3).toUpperCase()}`
      : 'CMH007';
    const channel = d.channel === 'MODERN_TRADE' ? 'MT' : 'GT';
    const subChannel = d.subChannel || 'RTL';
    const topDays = d.termOfPaymentDays || 0;

    const rowValues = [
      'ND6DATA',
      'customermaster',
      'value',
      ND6_COMPANY_ID,
      ND6_BRANCH_ID,
      custCode,
      custName,
      address1,
      address2,
      address3,
      city,
      phone,
      '0', // Fax
      '0', // Postal
      owner,
      taxAddress,
      '', // Contact person
      npwp,
      area,
      subArea,
      'MS0000',
      channel,
      subChannel,
      '-',
      '-',
      'SS0000',
      'SL0000',
      topDays || '0',
      d.channelTier || 'A',
      d.paymentType === 'CASH' ? 'Y' : 'N',
      d.paymentType !== 'CASH' ? 'Y' : 'N',
      '0',
      '0',
      '0',
      '0',
      d.taxType === 'PKP' ? 'Y' : 'N',
      d.isActive !== false ? 'Y' : 'N',
      d.isBumn ? 'Y' : 'N',
      d.isContraBill !== false ? 'Y' : 'N',
      'End',
    ];

    nd6RowsXml += `
      <Row ss:Height="20">
        ${rowValues
          .map(
            (val, idx) =>
              `<Cell ss:StyleID="${
                idx === 5 || idx === 3 || idx === 4 ? 'YellowCellBold' : 'YellowCell'
              }"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`
          )
          .join('')}
      </Row>`;
  });

  // Footer Row
  nd6RowsXml += `
    <Row ss:Height="20">
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">ND6DATA</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">DocumentEnd</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${dateStr}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">${data.length}</Data></Cell>
      <Cell ss:StyleID="MetaCell"><Data ss:Type="String">End</Data></Cell>
    </Row>`;

  // Build Sheet 2: Executive Detail Report
  const executiveHeaders = [
    'No',
    'Kode Outlet',
    'Nama Toko',
    'Nama Pemilik',
    'Alamat Toko',
    'Kota',
    'Kecamatan',
    'No Telepon',
    'Divisi',
    'Area',
    'Channel',
    'Sub Channel',
    'Tiering',
    'Pajak (Tax)',
    'NPWP / NIK',
    'Nama Pajak',
    'Alamat Pajak',
    'Tipe Pembayaran',
    'TOP (Hari)',
    'Jadwal RJP',
    'Hari Kunjungan',
    'Salesman',
    'Supervisor',
    'Status Approval',
    'Tgl Pengajuan',
    'Latitude',
    'Longitude',
  ];

  let execRowsXml = `
    <Row ss:Height="26">
      ${executiveHeaders
        .map(
          (h) =>
            `<Cell ss:StyleID="ExecHeader"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
        )
        .join('')}
    </Row>`;

  data.forEach((d, idx) => {
    const isEven = idx % 2 === 0;
    const styleId = isEven ? 'ExecRowEven' : 'ExecRowOdd';
    const dateFormatted = d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '-';

    const execCols = [
      idx + 1,
      d.customerCode || '-',
      d.name || '',
      d.ownerName || '-',
      d.address || '',
      d.city || 'CIMAHI',
      d.subAreaKecamatan || '-',
      d.phone || '-',
      d.division || 'BELFOODS',
      d.area || 'CMH',
      d.channel || 'GT',
      d.subChannel || 'RTL',
      d.channelTier || 'A',
      d.taxType || 'NON_PKP',
      d.taxNumber || '-',
      d.taxName || d.ownerName || '-',
      d.taxAddress || d.address || '-',
      d.paymentType || 'CASH',
      d.termOfPaymentDays || 0,
      d.visitWeekSchedule || 'ALL_WEEK',
      d.visitDays || '-',
      d.salesmanName || '-',
      d.spvName || '-',
      d.registrationStatus || '-',
      dateFormatted,
      d.latitude || 0,
      d.longitude || 0,
    ];

    execRowsXml += `
      <Row ss:Height="20">
        ${execCols
          .map(
            (c, cIdx) =>
              `<Cell ss:StyleID="${styleId}"><Data ss:Type="${
                typeof c === 'number' ? 'Number' : 'String'
              }">${escapeXml(c)}</Data></Cell>`
          )
          .join('')}
      </Row>`;
  });

  // Full XML Spreadsheet 2003 Document
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>CV SINAR ANUGRAH FMCG</Author>
  <Created>${now.toISOString()}</Created>
  <Company>CV SINAR ANUGRAH</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="MetaCell">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#374151"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="HeaderCell">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#111827"/>
   <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#9CA3AF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="YellowCell">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#000000"/>
   <Interior ss:Color="#FFFF00" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="YellowCellBold">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#FFFF00" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="ExecHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E40AF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
   </Borders>
  </Style>
  <Style ss:ID="ExecRowEven">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1F2937"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="ExecRowOdd">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1F2937"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="IMPORT_ND6_CUSTOMER">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="300"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="140"/>
   <Column ss:Width="250"/>
   <Column ss:Width="120"/>
   <Column ss:Width="130"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="70"/>
   <Column ss:Width="60"/>
   <Column ss:Width="60"/>
   <Column ss:Width="70"/>
   <Column ss:Width="50"/>
   ${nd6RowsXml}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="REKAP_REGISTRASI_LENGKAP">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="40"/>
   <Column ss:Width="95"/>
   <Column ss:Width="180"/>
   <Column ss:Width="140"/>
   <Column ss:Width="280"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="90"/>
   <Column ss:Width="130"/>
   <Column ss:Width="140"/>
   <Column ss:Width="220"/>
   <Column ss:Width="90"/>
   <Column ss:Width="70"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="95"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   ${execRowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(xmlContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
};

/**
 * 2. Export to ND6 Data Stream (TXT/Tab-separated format ala IMPORT CUSTOMER PVMI CIMAHI)
 */
export const exportCustomerNd6Txt = (data = [], filename = 'IMPORT_CUSTOMER_ND6.txt', user = 'ADMIN') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeVal = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;

  const lines = [
    `ND6DATA\tDocumentStart\t${dateStr}\t${timeVal.toFixed(15)}\t${(user || 'SYSTEM').toUpperCase()}`,
    `ND6DATA\tDocumentCheck\tcompanyID\t${ND6_COMPANY_ID}\tEnd`,
    `ND6DATA\tDocumentCheck\tbranchID\t${ND6_BRANCH_ID}\tEnd`,
    `ND6DATA\tDocumentCheck\tdivisionID\t${ND6_DIVISION_ID}\tEnd`,
  ];

  data.forEach((d) => {
    const custCode = d.customerCode || 'PVC0000';
    const custName = (d.name || '').toUpperCase();
    const address = (d.address || '').toUpperCase();
    const city = (d.city || 'CIMAHI').toUpperCase();
    const phone = (d.phone || '0').replace(/[^0-9]/g, '') || '0';
    const owner = (d.ownerName || custName).toUpperCase();
    const taxAddress = (d.taxAddress || address).toUpperCase();
    const npwp = d.taxNumber || '00.000.000.0-000.000';
    const area = d.area || 'CMH';
    const subArea = d.subAreaKecamatan ? `${area}${d.subAreaKecamatan.substring(0, 3).toUpperCase()}` : 'CMH007';
    const channel = d.channel === 'MODERN_TRADE' ? 'MT' : 'GT';
    const subChannel = d.subChannel || 'RTL';
    const topDays = d.termOfPaymentDays || 0;

    const rowTokens = [
      'ND6DATA',
      'customermaster',
      'value',
      ND6_COMPANY_ID,
      ND6_BRANCH_ID,
      custCode,
      custName,
      address,
      '', // Address 2
      '', // Address 3
      city,
      phone,
      '0', // Fax
      '0', // Postal
      owner,
      taxAddress,
      '', // Contact person
      npwp,
      area,
      subArea,
      'MS0000', // Market segment
      channel,
      subChannel,
      '-', // Group
      '-', // Sub group
      'SS0000',
      'SL0000',
      topDays || '0',
      d.channelTier || 'A',
      d.paymentType === 'CASH' ? 'Y' : 'N',
      d.paymentType !== 'CASH' ? 'Y' : 'N',
      '0', '0', '0', '0',
      d.taxType === 'PKP' ? 'Y' : 'N',
      d.isActive !== false ? 'Y' : 'N',
      d.isBumn ? 'Y' : 'N',
      d.isContraBill !== false ? 'Y' : 'N',
      'End',
    ];

    lines.push(rowTokens.join('\t'));
  });

  lines.push(`ND6DATA\tDocumentEnd\t${dateStr}\t${data.length}\tEnd`);

  const txtContent = lines.join('\n');
  downloadBlob(txtContent, filename, 'text/plain;charset=utf-8;');
};

/**
 * 3. Export to Human-Readable TXT Summary
 */
export const exportCustomerSummaryTxt = (data = [], filename = 'RINGKASAN_REGISTRASI_OUTLET.txt') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }

  let txt = `========================================================================================\n`;
  txt += `CV. SINAR ANUGRAH FMCG DISTRIBUTOR - LAPORAN REGISTRASI OUTLET BARU\n`;
  txt += `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}\n`;
  txt += `Total Record: ${data.length} Outlet\n`;
  txt += `========================================================================================\n\n`;

  data.forEach((d, idx) => {
    txt += `[#${idx + 1}] KODE: ${d.customerCode || 'MENUNGGU FINALISASI'} | STATUS: ${d.registrationStatus}\n`;
    txt += `  Nama Toko    : ${d.name} (${d.division || 'BELFOODS'})\n`;
    txt += `  Nama Pemilik : ${d.ownerName || '-'}\n`;
    txt += `  Alamat       : ${d.address}, ${d.subAreaKecamatan || ''}, ${d.area || 'CMH'}\n`;
    txt += `  No. Telepon  : ${d.phone || '-'}\n`;
    txt += `  Saluran      : ${d.channel} / ${d.subChannel} (Tier: ${d.channelTier || 'A'})\n`;
    txt += `  Pajak (Tax)  : ${d.taxType} (No: ${d.taxNumber || '-'})\n`;
    txt += `  Pembayaran   : ${d.paymentType} ${d.termOfPaymentDays ? `(${d.termOfPaymentDays} Hari)` : ''}\n`;
    txt += `  Jadwal RJP   : ${d.visitWeekSchedule} (Hari: ${d.visitDays || '-'})\n`;
    txt += `  Salesman     : ${d.salesmanName || '-'} | SPV: ${d.spvName || '-'} | Ops: ${d.opsManagerName || '-'}\n`;
    txt += `  Koordinat    : Lat ${d.latitude}, Lng ${d.longitude}\n`;
    txt += `----------------------------------------------------------------------------------------\n`;
  });

  downloadBlob(txt, filename, 'text/plain;charset=utf-8;');
};

/**
 * 4. Export to Standard CSV format
 */
export const exportCustomerCSV = (data = [], filename = 'DATA_CUSTOMER_REGISTRASI.csv') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }

  const headers = [
    'No',
    'Kode Customer',
    'Nama Outlet',
    'Nama Pemilik',
    'Alamat Lengkap',
    'Kota',
    'Kecamatan',
    'No Telepon',
    'Divisi',
    'Area',
    'Channel',
    'Sub Channel',
    'Tier',
    'Tipe Pajak',
    'NPWP / NIK',
    'Nama Pajak',
    'Alamat Pajak',
    'Tipe Bayar',
    'TOP (Hari)',
    'Jadwal RJP',
    'Hari Kunjungan',
    'Salesman',
    'Supervisor',
    'Status',
    'Tanggal Pengajuan',
    'Latitude',
    'Longitude',
  ];

  const rows = data.map((d, idx) => [
    idx + 1,
    `"${d.customerCode || '-'}"`,
    `"${(d.name || '').replace(/"/g, '""')}"`,
    `"${(d.ownerName || '').replace(/"/g, '""')}"`,
    `"${(d.address || '').replace(/"/g, '""')}"`,
    `"${d.city || 'CIMAHI'}"`,
    `"${(d.subAreaKecamatan || '').replace(/"/g, '""')}"`,
    `"${d.phone || '-'}"`,
    `"${d.division || 'BELFOODS'}"`,
    `"${d.area || 'CMH'}"`,
    `"${d.channel || 'GT'}"`,
    `"${d.subChannel || 'RTL'}"`,
    `"${d.channelTier || 'A'}"`,
    `"${d.taxType || 'NON_PKP'}"`,
    `"${d.taxNumber || '-'}"`,
    `"${(d.taxName || d.ownerName || '').replace(/"/g, '""')}"`,
    `"${(d.taxAddress || d.address || '').replace(/"/g, '""')}"`,
    `"${d.paymentType || 'CASH'}"`,
    d.termOfPaymentDays || 0,
    `"${d.visitWeekSchedule || 'EVERY_WEEK'}"`,
    `"${d.visitDays || '-'}"`,
    `"${(d.salesmanName || '').replace(/"/g, '""')}"`,
    `"${(d.spvName || '').replace(/"/g, '""')}"`,
    `"${d.registrationStatus || '-'}"`,
    d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '-',
    d.latitude || 0,
    d.longitude || 0,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * 5. Export to Official IMPORT NIK Excel (.xls format matching 1-to-1 IMPORT NIK.xlsx)
 * Format Kolom Sesuai File Referensi:
 * A: Kode Customer (cth: CMH00211, PVC0001)
 * B: Nama Toko (cth: TK MAJU JAYA)
 * C: NIK 16 Digit (cth: 3205313108950002) - Format Teks Utuh
 * D: Nama Pemilik / KTP (cth: AMIN FAJRI)
 * E: Alamat Toko (cth: JL. MARIBAYA SUKAMAJU RT 004 RW 014~)
 * F: Status PKP (N / Y)
 * G: Format NPWP (00.000.000.0-000.000)
 */
export const exportImportNikExcel = (data = [], filename = `IMPORT_NIK_${new Date().toISOString().split('T')[0]}.xls`) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data outlet / customer untuk ekspor NIK.');
    return;
  }

  let rowsXml = '';

  data.forEach((d) => {
    const custCode = d.customerCode || d.outletCode || 'CMH00000';
    const custName = (d.name || d.customerName || '').toUpperCase();
    const rawNik = String(d.taxNumber || d.nik || '').replace(/[^0-9]/g, '');
    const nik = rawNik.length >= 10 ? rawNik : '3200000000000000';
    const ownerName = (d.taxName || d.ownerName || custName).toUpperCase();
    const address = (d.taxAddress || d.address || '').toUpperCase();
    const isPkp = d.taxType === 'PKP' ? 'Y' : 'N';
    const npwp = d.taxType === 'PKP' && d.taxNumber && d.taxNumber.includes('.') ? d.taxNumber : '00.000.000.0-000.000';

    rowsXml += `
      <Row ss:Height="20">
        <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(custCode)}</Data></Cell>
        <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(custName)}</Data></Cell>
        <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(nik)}</Data></Cell>
        <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(ownerName)}</Data></Cell>
        <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(address)}~</Data></Cell>
        <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(isPkp)}</Data></Cell>
        <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(npwp)}</Data></Cell>
      </Row>`;
  });

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>CV SINAR ANUGRAH FMCG</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="TextCell">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#000000"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="CenterCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#000000"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Sheet1">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="95"/>
   <Column ss:Width="180"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="320"/>
   <Column ss:Width="50"/>
   <Column ss:Width="160"/>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(xmlContent, filename, 'application/vnd.ms-excel;charset=utf-8;');
};

/**
 * Helper to trigger browser file download
 */
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
