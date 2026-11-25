import { normalizeCompanyName } from './documentIdentity';
import { formatDateTimeId, safeStr } from './formatters';

const MIN_WIDTH = 96;

function tableLayout(headers, rows, maxColWidth) {
  return headers.map((h, colIdx) => {
    let maxLen = safeStr(h, '').length;
    for (const r of rows) {
      const len = safeStr(r[colIdx], '').length;
      if (len > maxLen) maxLen = len;
    }
    return Math.min(Math.max(maxLen, 4), maxColWidth);
  });
}

/** Tabel ASCII dengan garis +---+ ; kolom angka rata kanan, kolom pertama rata tengah. */
function buildAsciiTable(section, maxColWidth = 34) {
  const headers = section.headers || [];
  const rows = section.rows || [];
  if (!headers.length) return { text: '', width: 0 };
  const right = new Set(section.rightAlignCols || []);
  const center = new Set(section.centerAlignCols || []);
  const widths = tableLayout(headers, rows, maxColWidth);

  const divider = (char = '-') => '+' + widths.map((w) => char.repeat(w + 2)).join('+') + '+';
  const align = (text, width, mode) => {
    if (mode === 'right') return text.padStart(width, ' ');
    if (mode === 'center') {
      const left = Math.floor((width - text.length) / 2);
      return `${' '.repeat(left)}${text}`.padEnd(width, ' ');
    }
    return text.padEnd(width, ' ');
  };
  // Teks panjang dibungkus ke beberapa baris dalam kolomnya (tidak dipotong), kata terlalu
  // panjang dipecah per lebar kolom.
  const cellLines = (text, width) => {
    const out = [];
    let line = '';
    for (let word of safeStr(text, '').split(/\s+/).filter(Boolean)) {
      while (word.length > width) {
        if (line) {
          out.push(line);
          line = '';
        }
        out.push(word.slice(0, width));
        word = word.slice(width);
      }
      if (line && `${line} ${word}`.length > width) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line || !out.length) out.push(line);
    return out;
  };
  const formatRow = (cells, header = false) => {
    const wrapped = widths.map((w, idx) => cellLines(cells[idx], w));
    const height = Math.max(...wrapped.map((l) => l.length));
    return Array.from({ length: height }, (_, n) =>
      '|' +
      widths
        .map((w, idx) => {
          const mode = header
            ? 'center'
            : right.has(idx)
              ? 'right'
              : center.has(idx) || idx === 0
                ? 'center'
                : 'left';
          return ` ${align(wrapped[idx][n] ?? '', w, mode)} `;
        })
        .join('|') +
      '|'
    ).join('\n');
  };

  const lines = [divider('-'), formatRow(headers, true), divider('=')];
  if (!rows.length) {
    const inner = widths.reduce((a, b) => a + b + 3, -1);
    lines.push(`| ${'Tidak ada data pada bagian ini.'.padEnd(Math.max(inner - 2, 1), ' ')} |`);
  } else {
    const body = rows.map((r) => formatRow(r));
    // Baris yang terbungkus ke beberapa baris teks dipisah garis tipis agar batasnya jelas.
    const separated = body.some((text) => text.includes('\n'));
    body.forEach((text, i) => {
      lines.push(text);
      if (separated && i < body.length - 1) lines.push(divider('-'));
    });
  }
  lines.push(divider('-'));
  return { text: lines.join('\n'), width: divider().length };
}

const center = (text, width) => {
  const raw = String(text);
  return `${' '.repeat(Math.max(0, Math.floor((width - raw.length) / 2)))}${raw}`;
};

function wrap(text, width, indent = '') {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = `${indent}${word}`;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Dokumen teks polos dengan urutan yang sama dengan Word / PDF: kop, judul, keterangan
 * "Label : nilai", tabel bernomor, catatan bernomor, tanda tangan, dan penutup.
 */
export function buildDocumentTxt(blueprint) {
  const sections = (blueprint.paperSections || blueprint.sections || []).map((section) => ({
    section,
    table: buildAsciiTable(section),
  }));
  const width = Math.max(MIN_WIDTH, ...sections.map(({ table }) => table.width));
  const doubleRule = '='.repeat(width);
  const singleRule = '-'.repeat(width);

  const companyName = normalizeCompanyName(blueprint.companyName).toUpperCase();
  const companySub = blueprint.companySub || 'Distribusi & Operasional Penjualan FMCG';
  const printed = `Dicetak: ${formatDateTimeId(new Date())}`;
  const reference = blueprint.docNumber ? `Nomor: ${blueprint.docNumber}` : '';

  const title = safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase();
  const lines = [
    reference ? companyName.padEnd(width - reference.length) + reference : companyName,
    companySub,
    doubleRule,
    printed.padStart(width),
    '',
    center(title, width),
    center('='.repeat(Math.min(width, title.length)), width),
  ];
  if (blueprint.subtitle) lines.push(center(blueprint.subtitle, width));
  lines.push('');

  if (blueprint.metaItems?.length) {
    const labelWidth = Math.min(
      30,
      Math.max(...blueprint.metaItems.map((item) => safeStr(item.label, '').length))
    );
    for (const item of blueprint.metaItems) {
      lines.push(`${safeStr(item.label, '').padEnd(labelWidth)} : ${safeStr(item.value, '-')}`);
    }
    lines.push('');
  }

  for (const { section, table } of sections) {
    if (section.title) lines.push(section.title.toUpperCase());
    lines.push(table.text, '');
  }

  if (blueprint.notes?.length) {
    lines.push('Dasar & Catatan Dokumen:');
    blueprint.notes.forEach((note, index) => {
      const prefix = `${index + 1}. `;
      wrap(note, width - prefix.length).forEach((line, lineIndex) =>
        lines.push(`${lineIndex === 0 ? prefix : ' '.repeat(prefix.length)}${line}`)
      );
    });
    lines.push('');
  }

  lines.push(
    singleRule,
    `${companyName} — Sistem Distribusi & Operasional`.padEnd(width - 'Akhir dokumen'.length) +
      'Akhir dokumen'
  );
  return lines.join('\n');
}
