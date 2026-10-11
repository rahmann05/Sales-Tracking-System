import {
  ImageRun,
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import {documentImages, fitImage} from './documentImages';
import { formatDateTimeId, safeStr } from './formatters';

const COLORS = {
  primary: '1E3A8A',
  primaryLight: 'EFF6FF',
  secondary: '0F172A',
  muted: '475569',
  border: 'CBD5E1',
  rowAlt: 'F8FAFC',
  white: 'FFFFFF',
};

const THIN_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
};

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  left: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
  right: { style: BorderStyle.NONE, size: 0, color: COLORS.white },
};

const run = (text, opts = {}) =>
  new TextRun({ text: safeStr(text, ''), font: 'Calibri', size: 17, color: COLORS.secondary, ...opts });

function buildLetterhead(blueprint) {
  const companyName = blueprint.companyName || 'CV. SINAR ANUGRAH';
  const companySub = blueprint.companySub || 'Distribusi & Operasional Penjualan FMCG';
  const metaParts = [
    blueprint.docNumber ? `No. Dokumen: ${blueprint.docNumber}` : '',
    `Dicetak: ${formatDateTimeId(new Date())}`,
  ].filter(Boolean);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [run(companyName, { bold: true, size: 28, color: COLORS.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      border: { bottom: { style: BorderStyle.DOUBLE, size: 12, color: COLORS.primary, space: 6 } },
      children: [run(companySub, { size: 18, color: COLORS.muted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 140, after: 60 },
      children: [run(safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase(), { bold: true, size: 24 })],
    }),
    ...(blueprint.subtitle
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [run(blueprint.subtitle, { italics: true, size: 18, color: COLORS.muted })],
          }),
        ]
      : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [run(metaParts.join('   |   '), { size: 17, color: COLORS.muted })],
    }),
  ];
}

function buildMetadataTable(items = []) {
  const rows = [];
  const makePair = (item) => [
    new TableCell({
      width: { size: 18, type: WidthType.PERCENTAGE },
      borders: THIN_BORDERS,
      shading: { fill: COLORS.primaryLight, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [run(item ? item.label : '', { bold: true })] })],
    }),
    new TableCell({
      width: { size: 32, type: WidthType.PERCENTAGE },
      borders: THIN_BORDERS,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [run(item ? safeStr(item.value, '-') : '')] })],
    }),
  ];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(new TableRow({ children: [...makePair(items[i]), ...makePair(items[i + 1])] }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function buildSectionTable(section) {
  const headers = section.headers || [];
  const rightSet = new Set(section.rightAlignCols || []);
  const centerSet = new Set(section.centerAlignCols || []);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h, idx) =>
        new TableCell({
          width: section.columnWidths?.[idx]
            ? { size: section.columnWidths[idx], type: WidthType.PERCENTAGE }
            : undefined,
          borders: THIN_BORDERS,
          shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: rightSet.has(idx) ? AlignmentType.RIGHT : AlignmentType.CENTER,
              children: [run(h, { bold: true, color: COLORS.white })],
            }),
          ],
        })
    ),
  });

  const bodyRows = (section.rows || []).map(
    (row, rIdx) =>
      new TableRow({
        children: headers.map((_, cIdx) => {
          const align = rightSet.has(cIdx)
            ? AlignmentType.RIGHT
            : centerSet.has(cIdx) || cIdx === 0
              ? AlignmentType.CENTER
              : AlignmentType.LEFT;
          return new TableCell({
            borders: THIN_BORDERS,
            shading: rIdx % 2 === 1 ? { fill: COLORS.rowAlt, type: ShadingType.CLEAR } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({ alignment: align, children: [run(safeStr(row[cIdx], '-'), { size: 16 })] }),
            ],
          });
        }),
      })
  );

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] });
}

function buildSignatureTable(signatories = []) {
  const widthPct = Math.floor(100 / signatories.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: signatories.map(
          (sig) =>
            new TableCell({
              width: { size: widthPct, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              margins: { top: 200, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 640 },
                  children: [run(sig.role, { bold: true })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 40 },
                  children: [
                    run(`( ${safeStr(sig.name, '............................')} )`, {
                      bold: true,
                      underline: {},
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [run(sig.title, { size: 15, color: COLORS.muted })],
                }),
              ],
            })
        ),
      }),
    ],
  });
}

export async function buildDocumentDocx(blueprint) {
  const children = [...buildLetterhead(blueprint)];

  if (blueprint.metaItems?.length) {
    children.push(buildMetadataTable(blueprint.metaItems));
    children.push(new Paragraph({ spacing: { after: 140 }, children: [] }));
  }

  for (const section of blueprint.sections || []) {
    if (section.title) {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [run(section.title.toUpperCase(), { bold: true, size: 19, color: COLORS.primary })],
        })
      );
    }
    children.push(buildSectionTable(section));
  }

  for (const image of await documentImages(blueprint)) {
    const size = fitImage(image, 500, 300);
    children.push(new Paragraph({spacing: {before: 160, after: 100}, keepNext: true, children: [run(image.caption || 'Foto outlet', {bold: true})]}));
    children.push(new Paragraph({children: [new ImageRun({type: image.type, data: image.bytes, transformation: size})]}));
  }

  if (blueprint.notes?.length) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [run('Dasar & Catatan Dokumen:', { bold: true, size: 16 })],
      }),
      ...blueprint.notes.map(
        (note) =>
          new Paragraph({
            spacing: { after: 40 },
            children: [run(`• ${note}`, { italics: true, size: 15, color: COLORS.muted })],
          })
      )
    );
  }

  if (blueprint.signatories?.length) {
    children.push(buildSignatureTable(blueprint.signatories));
  }

  const doc = new Document({
    creator: blueprint.companyName || 'CV. SINAR ANUGRAH',
    title: blueprint.title || 'Dokumen Operasional',
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation:
                blueprint.orientation === 'landscape'
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT,
            },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
    return Packer.toBlob(doc);
  }
  return Packer.toBuffer(doc);
}
