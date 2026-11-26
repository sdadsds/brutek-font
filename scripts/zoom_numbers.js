const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const { buildNumberGlyphs } = require('../src/numbers');
const { subpathsToSvgD } = require('../src/geometry');

const nums = buildNumberGlyphs();
const keys = '0123456789'.split('');

const cols = 5, rows = 2;
const cellW = 460, cellH = 540;
const W = cols * cellW, H = rows * cellH;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

keys.forEach((ch, idx) => {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const cx = col * cellW;
  const cy = row * cellH;
  const baseLineY = cy + 460;
  const scale = 1.25;
  const g = nums[ch];
  const padX = (cellW - g.bbox.w * scale) / 2;

  svg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  svg += `<line x1="${cx}" y1="${baseLineY}" x2="${cx + cellW}" y2="${baseLineY}" stroke="#fca5a5" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<line x1="${cx}" y1="${baseLineY - 324 * scale}" x2="${cx + cellW}" y2="${baseLineY - 324 * scale}" stroke="#93c5fd" stroke-width="1" stroke-dasharray="4 4"/>`;

  const d = subpathsToSvgD(g.subpaths, scale, cx + padX, baseLineY);
  svg += `<path d="${d}" fill="#0a0a0a" fill-rule="nonzero"/>`;
  svg += `<text x="${cx + 16}" y="${cy + 34}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#64748b">${ch} (w=${g.bbox.w.toFixed(0)}, sp=${g.subpaths.length})</text>`;
});

svg += `</svg>`;
fs.writeFileSync('E:/Projects/typography101-font/scripts/zoom_numbers_after.png', new Resvg(svg, { fitTo: { mode: 'width', value: 2300 } }).render().asPng());
console.log('Rendered scripts/zoom_numbers_after.png');
