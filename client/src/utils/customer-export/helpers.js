export const ND6_COMPANY_ID = 'NS6083030001545';
export const ND6_BRANCH_ID = '1522743351512';
export const ND6_DIVISION_ID = '1675645496290';
export const escapeXml = unsafe => {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};
export function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], {
    type: mimeType
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
