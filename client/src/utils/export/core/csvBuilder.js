function escapeCsvField(field) {
  if (field === null || field === undefined) return '""';
  const raw = String(field);
  const safe = /^[=+@\-\t\r\n]/.test(raw) && typeof field !== 'number' ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildDocumentCsv(blueprint) {
  if (blueprint.csvContent) {
    return blueprint.csvContent.startsWith('\uFEFF')
      ? blueprint.csvContent
      : `\uFEFF${blueprint.csvContent}`;
  }

  const lines = [];
  const sections = blueprint.sections || [];
  if (!blueprint.rawSheetOnly && blueprint.metaItems?.length) {
    lines.push(['Atribut dokumen','Nilai'].map(escapeCsvField).join(','));
    for (const item of blueprint.metaItems) lines.push([item.label,item.value].map(escapeCsvField).join(','));
    lines.push('');
  }

  sections.forEach((section, index) => {
    if (sections.length > 1 && section.title) {
      if (index > 0) lines.push('');
      lines.push(escapeCsvField(section.title));
    }
    if (section.headers?.length) {
      lines.push(section.headers.map(escapeCsvField).join(','));
    }
    for (const row of section.rows || []) {
      lines.push(row.map(escapeCsvField).join(','));
    }
  });

  return `\uFEFF${lines.join('\r\n')}`;
}
