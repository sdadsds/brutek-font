const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const { loadOriginalGlyphs } = require('../src/originals');
const { buildUppercaseGlyphs } = require('../src/uppercase');
const { buildVietnameseGlyphs } = require('../src/vietnamese');
const { subpathsToSvgD } = require('../src/geometry');

const orig = loadOriginalGlyphs();
const upper = buildUppercaseGlyphs();
const vn = buildVietnameseGlyphs(orig, upper);

const chars = [
  'Ơ','Ờ','Ớ','Ở','Ỡ','Ợ',
  'ơ','ờ','ớ','ở','ỡ','ợ',
  'Ư','Ừ','Ứ','Ử','Ữ','Ự',
  'ư','ừ','ứ','ử','ữ','ự',
  'Ă','Ằ','Ắ','Ẳ','Ẵ','Ặ',
  'ă','ằ','ắ','ẳ','ẵ','ặ',
  'Â','Ầ','Ấ','Ẩ','Ẫ','Ậ',
  'â','ầ','ấ','ẩ','ẫ','ậ'
];

const cols = 6, rows = Math.ceil(chars.length / cols);
const cellW = 360, cellH = 460;
const W = cols * cellW, H = rows * cellH;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

chars.forEach((ch, idx) => {
  const col = idx % cols, row = Math.floor(idx / cols);
  const cx = col * cellW, cy = row * cellH;
  const baseY = cy + 375;
  const g = vn[ch];
  if (!g) return;
  const scale = 0.72;
  const padX = (cellW - g.bbox.w * scale) / 2;
  svg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  svg += `<line x1="${cx}" y1="${baseY}" x2="${cx + cellW}" y2="${baseY}" stroke="#fca5a5" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<path d="${subpathsToSvgD(g.subpaths, scale, cx + padX, baseY)}" fill="#0a0a0a" fill-rule="nonzero"/>`;
  svg += `<text x="${cx + 12}" y="${cy + 28}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#64748b">${ch}</text>`;
});
svg += `</svg>`;
fs.writeFileSync('E:/Projects/typography101-font/scripts/zoom_vn_fixes.png', new Resvg(svg, { fitTo: { mode: 'width', value: 2100 } }).render().asPng());
console.log('Rendered scripts/zoom_vn_fixes.png');
