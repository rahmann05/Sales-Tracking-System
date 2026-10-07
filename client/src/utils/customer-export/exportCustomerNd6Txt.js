import { ND6_COMPANY_ID, ND6_BRANCH_ID, ND6_DIVISION_ID, downloadBlob } from "./helpers";
export const exportCustomerNd6Txt = (data = [], filename = 'IMPORT_CUSTOMER_ND6.txt', user = 'ADMIN') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data registrasi customer untuk diekspor.');
    return;
  }
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeVal = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
  const lines = [`ND6DATA\tDocumentStart\t${dateStr}\t${timeVal.toFixed(15)}\t${(user || 'SYSTEM').toUpperCase()}`, `ND6DATA\tDocumentCheck\tcompanyID\t${ND6_COMPANY_ID}\tEnd`, `ND6DATA\tDocumentCheck\tbranchID\t${ND6_BRANCH_ID}\tEnd`, `ND6DATA\tDocumentCheck\tdivisionID\t${ND6_DIVISION_ID}\tEnd`];
  data.forEach(d => {
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
    const rowTokens = ['ND6DATA', 'customermaster', 'value', ND6_COMPANY_ID, ND6_BRANCH_ID, custCode, custName, address, '', '', city, phone, '0', '0', owner, taxAddress, '', npwp, area, subArea, 'MS0000', channel, subChannel, '-', '-', 'SS0000', 'SL0000', topDays || '0', d.channelTier || 'A', d.paymentType === 'CASH' ? 'Y' : 'N', d.paymentType !== 'CASH' ? 'Y' : 'N', '0', '0', '0', '0', d.taxType === 'PKP' ? 'Y' : 'N', d.isActive !== false ? 'Y' : 'N', d.isBumn ? 'Y' : 'N', d.isContraBill !== false ? 'Y' : 'N', 'End'];
    lines.push(rowTokens.join('\t'));
  });
  lines.push(`ND6DATA\tDocumentEnd\t${dateStr}\t${data.length}\tEnd`);
  const txtContent = lines.join('\n');
  downloadBlob(txtContent, filename, 'text/plain;charset=utf-8;');
};
