/**
 * Perhitungan tata letak formulir kertas yang dipakai bersama oleh PDF (formPdf.js) dan
 * Word (formDocx.js), supaya kedua format menghasilkan susunan kotak yang sama.
 */

export const COL_GAP = 2.5;

const LABELLED = ['kv', 'box', 'checks'];

/**
 * Lebar label disesuaikan teks terpanjang agar titik dua rapi: per kotak bila kolom berkotak,
 * dan satu lebar bersama untuk kolom tanpa kotak dalam satu blok.
 * `measure(label)` mengembalikan lebar teks dalam mm.
 */
export function resolveBlock(block, measure) {
  const widthOf = (line) => measure(line.label) + 2;
  const labelWidths = (col) =>
    col.lines.filter((l) => l.label && LABELLED.includes(l.t)).map(widthOf);
  const shared = Math.max(
    0,
    ...block.rows.flatMap((row) => row.columns.filter((c) => !c.box).flatMap(labelWidths))
  );
  return {
    ...block,
    rows: block.rows.map((row) => ({
      ...row,
      columns: row.columns.map((col) => {
        const own = col.box ? Math.max(0, ...labelWidths(col)) : shared;
        return {
          ...col,
          lines: col.lines.map((l) => (l.label && LABELLED.includes(l.t) ? { ...l, lw: own } : l)),
        };
      }),
    })),
  };
}

/** Lebar kolom (mm): `w` tetap, sisanya dibagi menurut `fr`. */
export function layoutColumns(columns, innerW) {
  const fixed = columns.reduce((sum, c) => sum + (c.w || 0), 0);
  const frTotal = columns.reduce((sum, c) => sum + (c.w ? 0 : c.fr || 1), 0);
  const avail = innerW - fixed - COL_GAP * (columns.length - 1);
  let x = 0;
  return columns.map((col) => {
    const width = col.w || (avail * (col.fr || 1)) / frTotal;
    const placed = { col, x, width };
    x += width + COL_GAP;
    return placed;
  });
}
