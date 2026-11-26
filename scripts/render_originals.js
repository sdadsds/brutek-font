const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');

const shapes = JSON.parse(fs.readFileSync('E:/Projects/typography101-font/scripts/extracted_raw.json', 'utf8'));

// Group shapes into letters
const BASELINE = 942.0638;
const XHEIGHT = 1158.0638;
const ASCENDER = 1269.0638;
const DESCENDER = 869.0638;

const letterMap = {
  a: [6],
  b: [8],
  c: [1],
  d: [9],
  e: [3],
  f: [10],
  g: [4],
  h: [11],
  i: [12, 13],
  j: [18, 20],
  k: [28],
  l: [19],
  m: [32],
  n: [17],
  o: [2],
  p: [26],
  q: [27],
  r: [29],
  s: [37, 16], // check #16!
  t: [14, 15],
  u: [21],
  v: [24],
  w: [25],
  x: [41],
  y: [22, 5, 23],
  z: [35],
};

function subpathsToSvgD(subpaths, ox, oy) {
  return subpaths.map(sp => {
    return sp.map(cmd => {
      if (cmd.type === 'M') return `M ${(cmd.x - ox).toFixed(2)} ${(oy - cmd.y).toFixed(2)}`;
      if (cmd.type === 'L') return `L ${(cmd.x - ox).toFixed(2)} ${(oy - cmd.y).toFixed(2)}`;
      if (cmd.type === 'C') return `C ${(cmd.x1 - ox).toFixed(2)} ${(oy - cmd.y1).toFixed(2)} ${(cmd.x2 - ox).toFixed(2)} ${(oy - cmd.y2).toFixed(2)} ${(cmd.x - ox).toFixed(2)} ${(oy - cmd.y).toFixed(2)}`;
      if (cmd.type === 'Z') return 'Z';
    }).join(' ');
  }).join(' ');
}

const cols = 7;
const cellW = 360;
const cellH = 480;
const keys = Object.keys(letterMap);
const rows = Math.ceil(keys.length / cols);
const W = cols * cellW;
const H = rows * cellH;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

keys.forEach((ch, idx) => {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const cx = col * cellW;
  const cy = row * cellH;
  const baseLineY = cy + 360;
  const xHeightY = baseLineY - 216;
  const ascY = baseLineY - 327;
  const descY = baseLineY + 73;

  // Cell border & guides
  svg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
  svg += `<line x1="${cx}" y1="${baseLineY}" x2="${cx + cellW}" y2="${baseLineY}" stroke="#ef4444" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<line x1="${cx}" y1="${xHeightY}" x2="${cx + cellW}" y2="${xHeightY}" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<line x1="${cx}" y1="${ascY}" x2="${cx + cellW}" y2="${ascY}" stroke="#10b981" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<line x1="${cx}" y1="${descY}" x2="${cx + cellW}" y2="${descY}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4 4"/>`;

  const ids = letterMap[ch];
  const glyphShapes = ids.map(i => shapes[i]);
  const minX = Math.min(...glyphShapes.map(s => s.bbox.minX));
  const maxX = Math.max(...glyphShapes.map(s => s.bbox.maxX));
  const gw = maxX - minX;
  const padX = (cellW - gw) / 2;

  svg += `<g transform="translate(${cx + padX}, ${baseLineY})">`;
  glyphShapes.forEach((s, si) => {
    const color = si === 0 ? '#111111' : (si === 1 ? '#e11d48' : '#2563eb');
    const d = subpathsToSvgD(s.subpaths, minX, BASELINE);
    svg += `<path d="${d}" fill="${color}" fill-opacity="${si === 0 ? 1 : 0.7}" fill-rule="evenodd"/>`;
  });
  svg += `</g>`;
  svg += `<text x="${cx + 12}" y="${cy + 28}" font-family="sans-serif" font-size="22" font-weight="bold" fill="#374151">${ch} (w=${gw.toFixed(0)})</text>`;
});

svg += `</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 2100 } });
const png = resvg.render().asPng();
fs.writeFileSync('E:/Projects/typography101-font/scripts/debug_originals.png', png);
console.log('Rendered debug_originals.png');
