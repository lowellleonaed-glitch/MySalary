const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height) {
    // We will generate RGBA pixels for SalaryHub icon
    const rowBytes = width * 4 + 1; // 1 filter byte per scanline
    const buffer = Buffer.alloc(rowBytes * height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = width * 0.44;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * rowBytes;
        buffer[rowOffset] = 0; // Filter type 0 (None)

        for (let x = 0; x < width; x++) {
            const pxOffset = rowOffset + 1 + x * 4;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Rounded background
            const rx = Math.abs(dx);
            const ry = Math.abs(dy);
            const cornerR = width * 0.22;
            const isInsideBox = rx <= cx - cornerR && ry <= cy;
            const isInsideBoy = ry <= cy - cornerR && rx <= cx;
            const isCorner = Math.sqrt(Math.pow(Math.max(0, rx - (cx - cornerR)), 2) + Math.pow(Math.max(0, ry - (cy - cornerR)), 2)) <= cornerR;

            if (isInsideBox || isInsideBoy || isCorner) {
                // Gradient from dark navy to deep slate
                const t = (x + y) / (width + height);
                let r = Math.round(11 * (1 - t) + 22 * t);
                let g = Math.round(16 * (1 - t) + 28 * t);
                let b = Math.round(30 * (1 - t) + 45 * t);

                // Draw central badge circle / emblem
                if (dist < radius * 0.65) {
                    // Teal/Cyan gradient (#00f5d4 to #00bbf9)
                    const subT = (x - (cx - radius * 0.65)) / (radius * 1.3);
                    r = Math.round(0);
                    g = Math.round(245 * (1 - subT) + 187 * subT);
                    b = Math.round(212 * (1 - subT) + 249 * subT);

                    // Inner wallet shape cutout in navy
                    const wx = Math.abs(x - cx);
                    const wy = Math.abs(y - cy);
                    if (wx < radius * 0.35 && wy < radius * 0.22) {
                        r = 11; g = 16; b = 30;
                    }
                }

                buffer[pxOffset] = r;
                buffer[pxOffset + 1] = g;
                buffer[pxOffset + 2] = b;
                buffer[pxOffset + 3] = 255; // Alpha
            } else {
                // Transparent outer
                buffer[pxOffset] = 0;
                buffer[pxOffset + 1] = 0;
                buffer[pxOffset + 2] = 0;
                buffer[pxOffset + 3] = 0;
            }
        }
    }

    const compressed = zlib.deflateSync(buffer);

    // PNG Signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR Chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type RGBA
    ihdr[10] = 0; // compression method
    ihdr[11] = 0; // filter method
    ihdr[12] = 0; // interlace method
    const ihdrChunk = makeChunk('IHDR', ihdr);

    // IDAT Chunk
    const idatChunk = makeChunk('IDAT', compressed);

    // IEND Chunk
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(len + 12);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, len + 8));
    buf.writeUInt32BE(crc, len + 8);
    return buf;
}

// CRC32 table & function
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
}

function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const rootDir = path.join(__dirname, '..');
const appleTouch180 = createPng(180, 180);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleTouch180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon-180x180.png'), appleTouch180);
fs.writeFileSync(path.join(rootDir, 'apple-touch-icon.png'), appleTouch180);
fs.writeFileSync(path.join(rootDir, 'apple-touch-icon-precomposed.png'), appleTouch180);

console.log('Successfully generated PNG icons in ./icons and root fallbacks');
