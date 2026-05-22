/**
 * Generates tray.png (22x22) and tray@2x.png (44x44) for the system tray.
 * Teal (#0d9488) rounded square with white "Rx" mark.
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUT = path.join(__dirname, '..', 'resources', 'icons');

const TEAL = [13, 148, 136, 255];
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
  return Buffer.concat([len, type, data, crc]);
}

function writePng(size, outPath) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const i = 1 + (x * 4);
      const rgba = pixel(x, y, size);
      row[i] = rgba[0];
      row[i + 1] = rgba[1];
      row[i + 2] = rgba[2];
      row[i + 3] = rgba[3];
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk(Buffer.from('IHDR'), ihdr),
    chunk(Buffer.from('IDAT'), compressed),
    chunk(Buffer.from('IEND'), Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
}

function pixel(x, y, size) {
  const s = size / 22;
  const px = Math.floor(x / s);
  const py = Math.floor(y / s);
  if (px < 1 || px > 20 || py < 1 || py > 20) return CLEAR;
  // White "Rx" glyph (approximate blocks)
  const inR =
    (px >= 7 && px <= 9 && py >= 6 && py <= 15) ||
    (px >= 7 && px <= 12 && py >= 6 && py <= 8) ||
    (px >= 7 && px <= 12 && py >= 11 && py <= 13) ||
    (px >= 10 && px <= 12 && py >= 8 && py <= 11);
  const inX =
    (px >= 13 && px <= 15 && py >= 6 && py <= 8) ||
    (px >= 13 && px <= 15 && py >= 13 && py <= 15) ||
    (px === 14 && py === 9) ||
    (px === 13 && py === 10) ||
    (px === 15 && py === 10) ||
    (px === 14 && py === 11) ||
    (px === 13 && py === 12) ||
    (px === 15 && py === 12);
  if (inR || inX) return WHITE;
  return TEAL;
}

writePng(22, path.join(OUT, 'tray.png'));
writePng(44, path.join(OUT, 'tray@2x.png'));
// Windows tray: use 22px PNG (Electron accepts PNG on Windows)
fs.copyFileSync(path.join(OUT, 'tray.png'), path.join(OUT, 'tray.ico'));
console.log('[generate-tray-icons] wrote', OUT);
