import { formatDateTimeId, safeStr } from './formatters';

function buildAsciiTable(headers = [], rows = [], maxColWidth = 34) {
  if (!headers.length) return '';
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = safeStr(h, '').length;
    for (const r of rows) {
      const len = safeStr(r[colIdx], '').length;
      if (len > maxLen) maxLen = len;
    }
    return Math.min(Math.max(maxLen, 4), maxColWidth);
  });

  const makeDivider = (char = '-') =>
    '+' + colWidths.map((w) => char.repeat(w + 2)).join('+') + '+';
  const formatRow = (rowArr) =>
    '|' +
    colWidths
      .map((w, idx) => {
        const raw = safeStr(rowArr[idx], '');
        const clipped = raw.length > w ? `${raw.slice(0, w - 1)}…` : raw;
        return ` ${clipped.padEnd(w, ' ')} `;
      })
      .join('|') +
    '|';

  const lines = [makeDivider('='), formatRow(headers), makeDivider('=')];
  if (!rows.length) {
    const totalInner = colWidths.reduce((a, b) => a + b + 3, -1);
    lines.push(`| ${'Tidak ada data pada bagian ini.'.padEnd(Math.max(totalInner - 2, 1), ' ')} |`);
  } else {
    for (const r of rows) lines.push(formatRow(r));
  }
  lines.push(makeDivider('-'));
  return lines.join('\n');
}

export function buildDocumentTxt(blueprint) {
  const companyName = blueprint.companyName || 'CV. SINAR ANUGRAH';
  const companySub = blueprint.companySub || 'Distribusi & Operasional Penjualan FMCG';
  const borderDouble = '='.repeat(96);
  const borderSingle = '-'.repeat(96);
  const lines = [
    borderDouble,
    companyName.toUpperCase(),
    companySub,
    borderSingle,
    safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase(),
  ];

  if (blueprint.subtitle) lines.push(blueprint.subtitle);
  if (blueprint.docNumber) lines.push(`No. Dokumen : ${blueprint.docNumber}`);
  lines.push(`Waktu Cetak : ${formatDateTimeId(new Date())}`);
  lines.push(borderDouble, '');

  if (blueprint.metaItems?.length) {
    lines.push('INFORMASI DOKUMEN:');
    for (const item of blueprint.metaItems) {
      lines.push(`  - ${safeStr(item.label, '').padEnd(28, ' ')} : ${safeStr(item.value, '-')}`);
    }
    lines.push('');
  }

  for (const section of blueprint.sections || []) {
    if (section.title) lines.push(`[ ${section.title.toUpperCase()} ]`);
    lines.push(buildAsciiTable(section.headers || [], section.rows || []));
    lines.push('');
  }

  if (blueprint.notes?.length) {
    lines.push('CATATAN & DASAR LAPORAN:');
    for (const note of blueprint.notes) {
      lines.push(`  * ${note}`);
    }
    lines.push('');
  }

  if (blueprint.signatories?.length) {
    lines.push(borderSingle, 'LEMBAR PENGESAHAN & OTORISASI:', '');
    const sigWidth = 28;
    lines.push(blueprint.signatories.map((s) => safeStr(s.role, '').padEnd(sigWidth, ' ')).join('   '));
    lines.push('');
    lines.push('');
    lines.push(
      blueprint.signatories
        .map((s) => `(${safeStr(s.name, '....................')})`.padEnd(sigWidth, ' '))
        .join('   ')
    );
    lines.push(blueprint.signatories.map((s) => safeStr(s.title, '').padEnd(sigWidth, ' ')).join('   '));
    lines.push('');
  }

  lines.push(borderDouble);
  return lines.join('\n');
}
