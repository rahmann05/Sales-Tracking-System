import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { documentImages, fitImage } from './documentImages';
import { loadDocumentLogo, logoSize } from './documentLogo';
import { buildFormChildren } from './formDocx';
import { normalizeCompanyName } from './documentIdentity';
import { formatDateTimeId, safeStr } from './formatters';

const FONT = 'Arial';
const COLORS = {
  ink: '000000',
  muted: '444444',
  headFill: 'D9D9D9',
  white: 'FFFFFF',
};
const MM_TO_PX = 3.7795;

const LINE = { style: BorderStyle.SINGLE, size: 4, color: COLORS.ink };
const GRID_BORDERS = { top: LINE, bottom: LINE, left: LINE, right: LINE };
const NONE = { style: BorderStyle.NONE, size: 0, color: COLORS.white };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE };

const run = (text, opts = {}) =>
  new TextRun({ text: safeStr(text, ''), font: FONT, size: 18, color: COLORS.ink, ...opts });

const pct = (size) => ({ size, type: WidthType.PERCENTAGE });

function letterheadCell(children, width, align = AlignmentType.LEFT) {
  return new TableCell({
    width: pct(width),
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: NONE,
      left: NONE,
      right: NONE,
      bottom: { style: BorderStyle.DOUBLE, size: 6, color: COLORS.ink },
    },
    margins: { top: 0, bottom: 80, left: 0, right: 60 },
    children: children.map((child) =>
      child instanceof Paragraph ? child : new Paragraph({ alignment: align, children: [child] })
    ),
  });
}

function buildLetterhead(blueprint, logo) {
  const company = normalizeCompanyName(blueprint.companyName).toUpperCase();
  const sub = blueprint.companySub || 'Distribusi & Operasional Penjualan FMCG';
  const cells = [];
  if (logo) {
    const size = logoSize(logo, 14);
    cells.push(
      letterheadCell(
        [
          new Paragraph({
            children: [
              new ImageRun({
                type: logo.type,
                data: logo.bytes,
                transformation: {
                  width: Math.round(size.width * MM_TO_PX),
                  height: Math.round(size.height * MM_TO_PX),
                },
              }),
            ],
          }),
        ],
        9
      )
    );
  }
  cells.push(
    letterheadCell(
      [
        new Paragraph({
          children: [run(company, { bold: true, size: 28 })],
        }),
        new Paragraph({ children: [run(sub, { size: 17, color: COLORS.muted })] }),
      ],
      logo ? 56 : 65
    )
  );
  cells.push(
    letterheadCell(
      [
        ...(blueprint.docNumber
          ? [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [run(blueprint.docNumber, { bold: true, size: 19 })],
              }),
            ]
          : []),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            run(`Dicetak: ${formatDateTimeId(new Date())}`, { size: 15, color: COLORS.muted }),
          ],
        }),
      ],
      35
    )
  );
  return new Table({
    width: pct(100),
    borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ children: cells })],
  });
}

function buildTitle(blueprint) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 40 },
      keepNext: true,
      children: [
        run(safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase(), {
          bold: true,
          size: 25,
          underline: {},
        }),
      ],
    }),
    ...(blueprint.subtitle
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [run(blueprint.subtitle, { size: 17 })],
          }),
        ]
      : [new Paragraph({ spacing: { after: 120 }, children: [] })]),
  ];
}

function metaCell(text, width, opts = {}) {
  return new TableCell({
    width: pct(width),
    borders: NO_BORDERS,
    margins: { top: 20, bottom: 20, left: 0, right: 60 },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [run(text, { size: 17, bold: opts.bold })],
      }),
    ],
  });
}

/** Keterangan gaya surat: Label : nilai, dua pasang per baris, tanpa garis. */
function buildMetadataTable(items = []) {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];
    rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          metaCell(left.label, 17),
          metaCell(':', 2, { center: true }),
          metaCell(safeStr(left.value, '-'), 31, { bold: true }),
          metaCell(right ? right.label : '', 17),
          metaCell(right ? ':' : '', 2, { center: true }),
          metaCell(right ? safeStr(right.value, '-') : '', 31, { bold: true }),
        ],
      })
    );
  }
  return new Table({ width: pct(100), borders: { ...NO_BORDERS }, rows });
}

function buildSectionTable(section, compact) {
  const headers = section.headers || [];
  const rightSet = new Set(section.rightAlignCols || []);
  const centerSet = new Set(section.centerAlignCols || []);
  const fontSize = headers.length > 12 ? 13 : compact ? 14 : 16;
  const pad = headers.length > 12 || compact ? 40 : 60;

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(
      (h, idx) =>
        new TableCell({
          width: section.columnWidths?.[idx] ? pct(section.columnWidths[idx]) : undefined,
          borders: GRID_BORDERS,
          shading: { fill: COLORS.headFill, type: ShadingType.CLEAR, color: 'auto' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: pad + 20, bottom: pad + 20, left: 70, right: 70 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [run(h, { bold: true, size: fontSize })],
            }),
          ],
        })
    ),
  });

  const bodyRows = (section.rows || []).map(
    (row) =>
      new TableRow({
        cantSplit: true,
        children: headers.map((_, cIdx) => {
          const align = rightSet.has(cIdx)
            ? AlignmentType.RIGHT
            : centerSet.has(cIdx) || cIdx === 0
              ? AlignmentType.CENTER
              : AlignmentType.LEFT;
          return new TableCell({
            borders: GRID_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: pad, bottom: pad, left: 70, right: 70 },
            children: [
              new Paragraph({
                alignment: align,
                children: [run(safeStr(row[cIdx], '-'), { size: fontSize })],
              }),
            ],
          });
        }),
      })
  );

  return new Table({ width: pct(100), rows: [headerRow, ...bodyRows] });
}

function signatureCell(sig, width) {
  return new TableCell({
    width: pct(width),
    borders: NO_BORDERS,
    margins: { top: 200, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 900 },
        keepNext: true,
        children: [run(sig.role, { size: 17 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        keepNext: true,
        children: [
          run(safeStr(sig.name, '............................'), {
            bold: true,
            size: 17,
            underline: {},
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run(sig.title, { size: 15, color: COLORS.muted })],
      }),
    ],
  });
}

function buildSignatureTable(signatories = []) {
  // Satu penandatangan: blok sempit di sisi kanan halaman, seperti surat resmi.
  const single = signatories.length === 1;
  const width = single ? 100 : Math.floor(100 / signatories.length);
  return new Table({
    width: pct(single ? 38 : 100),
    alignment: single ? AlignmentType.RIGHT : AlignmentType.CENTER,
    borders: { ...NO_BORDERS },
    rows: [
      new TableRow({
        cantSplit: true,
        children: signatories.map((sig) => signatureCell(sig, width)),
      }),
    ],
  });
}

function buildFooter(blueprint, contentWidth) {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: '666666', space: 4 } },
        tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
        children: [
          run(`${normalizeCompanyName(blueprint.companyName)} — Sistem Distribusi & Operasional`, {
            size: 15,
            color: COLORS.muted,
          }),
          new TextRun({
            children: ['\tHalaman ', PageNumber.CURRENT, ' dari ', PageNumber.TOTAL_PAGES],
            font: FONT,
            size: 15,
            color: COLORS.muted,
          }),
        ],
      }),
    ],
  });
}

export async function buildDocumentDocx(blueprint) {
  const landscape = blueprint.orientation === 'landscape';
  const asForm = Boolean(blueprint.form);
  const margin = landscape || asForm ? 680 : 850;
  const contentWidth = (landscape ? 16838 : 11906) - margin * 2;
  const compact = blueprint.compact === true;
  const logo = await loadDocumentLogo();

  // Formulir kertas (mis. Form Registrasi Outlet) digambar dari model formulir, bukan tabel laporan.
  const children = asForm
    ? buildFormChildren(
        blueprint,
        logo,
        blueprint.signatories?.length ? buildSignatureTable(blueprint.signatories) : null
      )
    : [buildLetterhead(blueprint, logo), ...buildTitle(blueprint)];
  if (!asForm && blueprint.metaItems?.length) {
    children.push(buildMetadataTable(blueprint.metaItems));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  }

  for (const section of asForm ? [] : blueprint.sections || []) {
    if (section.title) {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 70 },
          keepNext: true,
          children: [run(section.title.toUpperCase(), { bold: true, size: 18 })],
        })
      );
    }
    children.push(buildSectionTable(section, compact));
    children.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
  }

  let firstAttachment = true;
  for (const image of await documentImages(blueprint)) {
    const size = fitImage(image, 500, 300);
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        keepNext: true,
        pageBreakBefore: asForm && firstAttachment,
        children: [run(image.caption || 'Lampiran foto', { bold: true })],
      }),
      new Paragraph({
        children: [new ImageRun({ type: image.type, data: image.bytes, transformation: size })],
      })
    );
    firstAttachment = false;
  }

  if (!asForm && blueprint.notes?.length) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 50 },
        keepNext: true,
        children: [run('Dasar & Catatan Dokumen:', { bold: true, size: 16 })],
      }),
      ...blueprint.notes.map(
        (note, index) =>
          new Paragraph({
            spacing: { after: 30 },
            indent: { left: 300, hanging: 300 },
            children: [run(`${index + 1}.\t${note}`, { size: 15 })],
            tabStops: [{ type: TabStopType.LEFT, position: 300 }],
          })
      )
    );
  }

  if (!asForm && blueprint.signatories?.length) {
    children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
    children.push(buildSignatureTable(blueprint.signatories));
  }

  const doc = new Document({
    creator: normalizeCompanyName(blueprint.companyName),
    title: blueprint.title || 'Dokumen Operasional',
    styles: { default: { document: { run: { font: FONT, size: 18 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
            margin: { top: margin, right: margin, bottom: margin + 200, left: margin, footer: 400 },
          },
        },
        footers: { default: buildFooter(blueprint, contentWidth) },
        children,
      },
    ],
  });

  if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
    return Packer.toBlob(doc);
  }
  return Packer.toBuffer(doc);
}
