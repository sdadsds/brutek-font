const fs = require('fs');
const ot = require('opentype.js');
const { Resvg } = require('@resvg/resvg-js');

const buf = fs.readFileSync('E:/Projects/typography101-font/dist/Typography101-Regular.otf');
const font = ot.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const p = font.getPath('qrstuvwxyz', 640, 616, 112);
const d = p.toPathData(2);
console.log('len:', d.length);
console.log('weird tokens:', d.match(/[eE][+-]?\d+|\d+\.\d+\.\d+|[^MLCQZ0-9.\- ]/g));

// Check exact opentype.js commands of w, ö, ç, é
for (const ch of ['w', 'ö', 'ç', 'é']) {
  const g = font.charToGlyph(ch);
  const gp = g.getPath(50, 200, 100);
  const gd = gp.toPathData(2);
  console.log(`\n=== ${ch} (${g.name}) ===`);
  console.log('d:', gd);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><path d="${gd}" fill="#000"/></svg>`;
  const r = new Resvg(svg).render();
  let ink = 0;
  for (let i = 3; i < r.pixels.length; i += 4) if (r.pixels[i] > 0) ink++;
  console.log('ink pixels:', ink);
}

// Check 'qrstuvwxyz' substring by substring
for (let len = 1; len <= 10; len++) {
  const sub = 'qrstuvwxyz'.slice(0, len);
  const sd = font.getPath(sub, 10, 200, 100).toPathData(2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300"><path d="${sd}" fill="#000"/></svg>`;
  const r = new Resvg(svg).render();
  let ink = 0;
  for (let i = 3; i < r.pixels.length; i += 4) if (r.pixels[i] > 0) ink++;
  console.log(sub.padEnd(12), 'dlen=', sd.length, 'ink=', ink);
}
