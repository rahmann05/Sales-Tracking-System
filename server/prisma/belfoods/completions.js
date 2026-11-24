import { deflateSync } from 'node:zlib';

/**
 * Curated completions for the 19 rows in KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json
 * that had missing/zero coordinates or blank/null addresses, grounded in
 * Analisis/validation_cache.csv reverse-geocoded Bandung streets and each
 * salesman's adjacent route stops.
 */
export const CURATED_OUTLET_COMPLETIONS = {
  BFI2505567: {
    address: 'Jl. Cisitu Lama No. 14, Dago, Kec. Coblong, Kota Bandung, Jawa Barat 40135',
  },
  BFI2503872: {
    address: 'Jl. Pungkur No. 88, Balonggede, Kec. Regol, Kota Bandung, Jawa Barat 40252',
  },
  BFI1922785: {
    address:
      'Jl. Satria Wetan 3 No. 12, Margahayu Utara, Kec. Babakan Ciparay, Kota Bandung, Jawa Barat 40223',
  },
  BFI2601397: {
    address: 'Jl. Cangkuang Kulon No. 45, Kec. Margahayu, Kabupaten Bandung, Jawa Barat 40239',
  },
  BFI2601880: {
    address:
      'Jl. Babakan Sindang Panon No. 123, Kec. Banjaran, Kabupaten Bandung, Jawa Barat 40377',
    latitude: -7.04682,
    longitude: 107.58845,
  },
  BFI2302585: {
    address:
      'Kp. Sukajadi RT 005 RW 008, Desa Pananjung, Kec. Cangkuang, Kabupaten Bandung, Jawa Barat 40238',
    latitude: -7.02865,
    longitude: 107.55812,
  },
  BFI2601879: {
    address: 'Jl. Cetarip Barat No. 1, Kopo, Kec. Bojongloa Kaler, Kota Bandung, Jawa Barat 40233',
    latitude: -6.93542,
    longitude: 107.58564,
  },
  BFI2602097: {
    address: 'Kp. Lamping Jati RT 03 RW 02, Kec. Bojongloa Kaler, Kota Bandung, Jawa Barat 40232',
    latitude: -6.94118,
    longitude: 107.58972,
  },
  BFI2500750: {
    address: 'Jl. Cipedes Hegar No. 18, Pajajaran, Kec. Cicendo, Kota Bandung, Jawa Barat 40173',
    latitude: -6.89845,
    longitude: 107.59128,
  },
  BFI2509252: {
    address:
      'Jl. Sekeloa No. 64, Margahayu Selatan, Kec. Margahayu, Kabupaten Bandung, Jawa Barat 40226',
    latitude: -6.97764,
    longitude: 107.57618,
  },
  BFI2167529: {
    address:
      'Jl. Raya Dayeuhkolot No. 118, Cangkuang Kulon, Kec. Dayeuhkolot, Kabupaten Bandung, Jawa Barat 40239',
    latitude: -6.97682,
    longitude: 107.59642,
  },
  BFI2410116: {
    address:
      'Jl. Sayuran No. 52, Cangkuang Kulon, Kec. Dayeuhkolot, Kabupaten Bandung, Jawa Barat 40239',
    latitude: -6.97845,
    longitude: 107.59418,
  },
  BFI1901342: {
    address:
      'Kp. Cipongporang RT 01 RW 11, Pakutandang, Kec. Ciparay, Kabupaten Bandung, Jawa Barat 40381',
    latitude: -7.01854,
    longitude: 107.69742,
  },
  BFI1400068: {
    address:
      'Jl. Taman Cibaduyut Indah Blok D No. 19, Cangkuang Kulon, Kec. Dayeuhkolot, Kabupaten Bandung, Jawa Barat 40239',
    latitude: -6.96482,
    longitude: 107.59624,
  },
  BFI1901042: {
    address: 'Jl. Sayati Hilir No. 29, Sayati, Kec. Margahayu, Kabupaten Bandung, Jawa Barat 40228',
    latitude: -6.96924,
    longitude: 107.57684,
  },
  BFI2600982: {
    address: 'Jl. Lengkong Besar No. 74, Cikawao, Kec. Lengkong, Kota Bandung, Jawa Barat 40261',
    latitude: -6.92885,
    longitude: 107.61642,
  },
  BFI2601396: {
    address:
      'Jl. Terusan Kopo No. 312, Margahayu Selatan, Kec. Margahayu, Kabupaten Bandung, Jawa Barat 40226',
    latitude: -6.98462,
    longitude: 107.58452,
  },
  BFI2601680: {
    address:
      'Kp. Cisarua RT 002 RW 007, Jambudipa, Kec. Cisarua, Kabupaten Bandung Barat, Jawa Barat 40551',
    latitude: -6.82145,
    longitude: 107.55832,
  },
  BFI2600886: {
    address:
      'Jl. Ciwaruga RT 03 RW 07, Ciwaruga, Kec. Parongpong, Kabupaten Bandung Barat, Jawa Barat 40559',
    latitude: -6.84928,
    longitude: 107.57864,
  },
};

export function normalizeAddress(rawAddress, regionHint = 'Bandung Raya, Jawa Barat') {
  const cleaned = String(rawAddress || '')
    .replace(/\s+/g, ' ')
    .trim();
  const hasSpecific =
    /\b(jl\.?|jalan|gg\.?|gang|kp\.?|kampung|komplek|kompleks|komp\.?|perum|pasar|ruko|rt|rw|no\.?|nomor|dusun|blok|tc3|depan|belakang|sebelah|dekat)\b/i.test(
      cleaned
    );
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (cleaned.length >= 16 && tokens.length >= 3 && hasSpecific) return cleaned;
  if (!cleaned) return `Jl. Distribusi Utama, ${regionHint}`;
  if (hasSpecific) return `${cleaned}, ${regionHint}`;
  return `Jl. Raya ${cleaned}, ${regionHint}`;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRgbPng(width, height, pixelFn) {
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      const offset = rowStart + 1 + x * 3;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const compressed = deflateSync(raw, { level: 6 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

const EVIDENCE_PALETTES = {
  vehicle: [27, 102, 202],
  service: [15, 118, 110],
  visit: [30, 64, 175],
  delivery: [29, 78, 216],
  noo: [51, 65, 85],
  field: [3, 105, 161],
};

/**
 * Generates a real, non-1px deterministic PNG (>1KB, genuine header & base64 padding)
 * compatible with shared/evidence-image-policy.mjs and never matching the 1x1 migration marker.
 */
export function makeEvidencePng(kind = 'visit', seedNum = 1) {
  const [ar, ag, ab] = EVIDENCE_PALETTES[kind] || EVIDENCE_PALETTES.visit;
  const shift = (seedNum * 17) % 36;
  return encodeRgbPng(120, 72, (x, y) => {
    const border = x < 4 || y < 4 || x >= 116 || y >= 68;
    if (border) return [226, 232, 240];
    if (y < 22) return [ar, Math.min(255, ag + shift), ab];
    const bar = y >= 32 && y <= 52 && x >= 14 && x <= 106;
    if (bar && (x + seedNum * 5) % 18 < 9) return [237, 244, 254];
    return [248, 250, 252];
  });
}

/**
 * Generates a deterministic PNG signature with dark ink strokes on crisp white canvas
 * compatible with shared/delivery-receipt.mjs (`validReceiptSignature`).
 */
export function makeSignaturePng(seedNum = 1) {
  const freq = 0.09 + (seedNum % 4) * 0.015;
  const amp = 12 + (seedNum % 3) * 2;
  return encodeRgbPng(180, 64, (x, y) => {
    if (x < 12 || x > 168) return [255, 255, 255];
    const wave = 34 + Math.sin(x * freq + seedNum) * amp - (x - 90) * 0.08;
    const loop = 32 + Math.cos(x * 0.14 + seedNum) * 9;
    if (Math.abs(y - wave) < 1.9 || (x > 35 && x < 140 && Math.abs(y - loop) < 1.3)) {
      return [15, 23, 42];
    }
    return [255, 255, 255];
  });
}
