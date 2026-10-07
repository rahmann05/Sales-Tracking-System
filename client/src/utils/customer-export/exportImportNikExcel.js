import { escapeXml, downloadBlob } from "./helpers";
export const exportImportNikExcel = (data = [], filename = `IMPORT_NIK_${new Date().toISOString().split('T')[0]}.xls`) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data outlet / customer untuk ekspor NIK.');
    return;
  }
  let rowsXml = '';
  data.forEach(d => {
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
