import {
  AlignmentType,
  BorderStyle,
  HeightRule,
  ImageRun,
  LineRuleType,
  Paragraph,
  SymbolRun,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { logoSize } from './documentLogo';
import { normalizeCompanyName } from './documentIdentity';
import { COL_GAP, layoutColumns, resolveBlock } from './formLayout';

/**
 * Penggambar formulir kertas ke Word (.docx) dari model yang sama dengan PDF.
 * Setiap blok adalah tabel bergaris dengan sel berkotak untuk pilihan; kotak centang memakai
 * simbol Wingdings agar tampil sama di semua Word.
 */

const FONT = 'Arial';
const SIZE = 15; // 7.5 pt
const SMALL = 13;
const MM = 56.69; // twips per mm
const PAGE_W_MM = 186;
const PAD = 1.8;

const tw = (mm) => Math.round(mm * MM);
const LINE = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const BOX_BORDERS = { top: LINE, bottom: LINE, left: LINE, right: LINE };

/** Estimasi lebar teks Arial 7.5pt kapital (mm), untuk lebar label sebelum dirender Word. */
const estimateWidth = (label) => String(label).length * 1.72;

const run = (text, opts = {}) =>
  new TextRun({ text: String(text ?? ''), font: FONT, size: opts.small ? SMALL : SIZE, ...opts });
const checkbox = (checked) =>
  new SymbolRun({ char: checked ? 'F0FE' : 'F0A8', symbolfont: 'Wingdings', size: SIZE + 2 });

const tight = { before: 0, after: 0, line: 250, lineRule: LineRuleType.AT_LEAST };

function linesToParagraphs(lines, widthMm) {
  return lines.map((line) => {
    switch (line.t) {
      case 'gap':
        return new Paragraph({
          spacing: { before: 0, after: 0, line: tw(line.h), lineRule: LineRuleType.EXACT },
          children: [],
        });
      case 'kv':
      case 'box': {
        const lw = tw(line.lw);
        return new Paragraph({
          spacing: tight,
          indent: { left: lw + tw(2.6), hanging: lw + tw(2.6) },
          tabStops: [
            { type: TabStopType.LEFT, position: lw },
            { type: TabStopType.LEFT, position: lw + tw(2.6) },
          ],
          border: line.t === 'box' ? BOX_BORDERS : undefined,
          children: [run(line.label), run('\t:\t'), run(line.value, { bold: true })],
        });
      }
      case 'check':
        return new Paragraph({
          spacing: tight,
          tabStops: [{ type: TabStopType.RIGHT, position: tw(widthMm) }],
          children: [run(line.label, { bold: line.bold }), run('\t'), checkbox(line.checked)],
        });
      case 'checks': {
        const lw = line.label ? tw(line.lw) + tw(2.6) : 0;
        const cell = (tw(widthMm) - lw) / line.items.length;
        const stops = line.items.map((_, i) => ({
          type: TabStopType.LEFT,
          position: Math.round(lw + cell * i),
        }));
        const children = line.label ? [run(line.label), run('\t:\t')] : [];
        line.items.forEach((item, i) => {
          children.push(run(item.label), run('  '), checkbox(item.checked));
          if (i < line.items.length - 1) children.push(run('\t'));
        });
        return new Paragraph({
          spacing: tight,
          tabStops: [
            ...(line.label
              ? [{ type: TabStopType.LEFT, position: tw(line.lw) }]
              : []),
            ...stops.slice(line.label ? 0 : 1),
          ],
          children,
        });
      }
      default:
        return new Paragraph({
          spacing: tight,
          alignment: line.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [run(line.text, { bold: line.bold, italics: line.italic, small: line.small })],
        });
    }
  });
}

const cell = (children, widthMm, borders, extra = {}) =>
  new TableCell({
    width: { size: tw(widthMm), type: WidthType.DXA },
    borders,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 20, bottom: 20, left: 0, right: 0 },
    children: children.length ? children : [new Paragraph({ spacing: tight, children: [] })],
    ...extra,
  });

/** Satu baris blok: tabel bersarang tanpa garis luar; kolom berkotak punya garis sendiri. */
function buildRowTable(row, innerW) {
  const placed = layoutColumns(row.columns, innerW);
  const cells = [];
  const widths = [];
  placed.forEach(({ col, width }, index) => {
    const pad = col.box ? 1.5 : 0;
    cells.push(
      cell(
        linesToParagraphs(col.lines, width - pad * 2),
        width,
        col.box ? BOX_BORDERS : NO_BORDERS,
        col.box ? { margins: { top: 40, bottom: 40, left: tw(pad), right: tw(pad) } } : {}
      )
    );
    widths.push(tw(width));
    if (index < placed.length - 1) {
      cells.push(cell([], COL_GAP, NO_BORDERS));
      widths.push(tw(COL_GAP));
    }
  });
  return new Table({
    width: { size: tw(innerW), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: widths,
    borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ cantSplit: true, children: cells })],
  });
}

/** Satu blok formulir: kotak luar satu sel yang memuat satu tabel bersarang per baris. */
function buildBlock(block, minHeightMm = 0) {
  const resolved = resolveBlock(block, estimateWidth);
  const innerW = PAGE_W_MM - PAD * 2;
  const minH = Math.max(minHeightMm, ...block.rows.map((r) => r.minH || 0));
  const content = resolved.rows.flatMap((row) => [buildRowTable(row, innerW), spacerParagraph(1)]);
  return new Table({
    width: { size: tw(PAGE_W_MM), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [tw(PAGE_W_MM)],
    rows: [
      new TableRow({
        cantSplit: true,
        height: minH ? { value: tw(minH), rule: HeightRule.ATLEAST } : undefined,
        children: [
          new TableCell({
            width: { size: tw(PAGE_W_MM), type: WidthType.DXA },
            borders: BOX_BORDERS,
            margins: { top: tw(PAD), bottom: tw(PAD), left: tw(PAD), right: tw(PAD) },
            children: content,
          }),
        ],
      }),
    ],
  });
}

function buildHeader(model, blueprint, logo) {
  const left = [];
  if (logo) {
    const size = logoSize(logo, 12);
    left.push(
      new Paragraph({
        spacing: tight,
        children: [
          new ImageRun({
            type: logo.type,
            data: logo.bytes,
            transformation: {
              width: Math.round(size.width * 3.7795),
              height: Math.round(size.height * 3.7795),
            },
          }),
        ],
      })
    );
  }
  left.push(
    new Paragraph({
      spacing: tight,
      children: [
        run(normalizeCompanyName(blueprint.companyName).toUpperCase(), { bold: true, size: 23 }),
      ],
    }),
    new Paragraph({
      spacing: tight,
      children: [run('F M C G   D I S T R I B U T O R', { size: 12 })],
    })
  );
  return new Table({
    width: { size: tw(PAGE_W_MM), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [tw(62), tw(62), tw(62)],
    borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
    rows: [
      new TableRow({
        children: [
          cell(left, 62, NO_BORDERS),
          cell(
            [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 0 },
                children: [run(model.title, { bold: true, size: 22 })],
              }),
            ],
            62,
            NO_BORDERS
          ),
          cell([], 62, NO_BORDERS),
        ],
      }),
    ],
  });
}

const metaParagraph = (item) =>
  new Paragraph({
    spacing: { before: 30, after: 30 },
    tabStops: [
      { type: TabStopType.LEFT, position: tw(22) },
      { type: TabStopType.LEFT, position: tw(25) },
    ],
    children: [
      run(item.label, { bold: true, size: 17 }),
      run('\t:\t', { bold: true, size: 17 }),
      run(item.value, { bold: true, size: 17 }),
    ],
  });

function spacerParagraph(mm) {
  return new Paragraph({
    spacing: { before: 0, after: 0, line: tw(mm), lineRule: LineRuleType.EXACT },
    children: [],
  });
}

/**
 * Isi dokumen formulir untuk Word. `signature` adalah tabel tanda tangan yang dibuat
 * docxBuilder (Sales pengaju + Supervisor), supaya aturan tanda tangan terpusat di satu tempat.
 */
export function buildFormChildren(blueprint, logo, signature) {
  const model = blueprint.form;
  const children = [
    buildHeader(model, blueprint, logo),
    spacerParagraph(1.5),
    ...model.meta.map(metaParagraph),
    spacerParagraph(1.5),
  ];
  model.blocks.forEach((block) => {
    children.push(buildBlock(block), spacerParagraph(2));
  });
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [run(model.footnote, { bold: true, small: true })],
    }),
    buildBlock(model.mapping, 26)
  );
  if (signature) children.push(spacerParagraph(3), signature);
  return children;
}

