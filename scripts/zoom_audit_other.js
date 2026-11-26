const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const { loadOriginalGlyphs } = require('../src/originals');
const { buildUppercaseGlyphs } = require('../src/uppercase');
const { buildPunctuationGlyphs } = require('../src/punctuation');
const { buildSpecialLetterGlyphs } = require('../src/special_letters');
const { subpathsToSvgD } = require('../src/geometry');

const orig = loadOriginalGlyphs();
const upper = buildUppercaseGlyphs();
const punct = buildPunctuationGlyphs();
const special = buildSpecialLetterGlyphs(orig, upper);
const all = { ...orig, ...upper, ...punct, ...special };

const auditChars = [
  'ß', 'Æ', 'æ', 'Œ', 'œ', 'Ø', 'ø', 'Ð', 'ð', 'Þ', 'þ', 'Ł', 'ł',
  'B', 'E', 'F', 'G', 'K', 'Q', 'R', 'S', '?', '¿', '&', '$', '§'
];

const cols = 7;
const rows = Math.ceil(auditChars.length / cols);
const cellW = 380, cellH = 460;
const W = cols * cellW, H = rows * cellH;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

auditChars.forEach((ch, idx) => {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const cx = col * cellW;
  const cy = row * cellH;
  const baseLineY = cy + 380;
  const g = all[ch];
  const scale = Math.min(1.0, 300 / Math.max(g.bbox.w, 1), 330 / Math.max(g.bbox.maxY - g.bbox.minY, 1));
  const padX = (cellW - g.bbox.w * scale) / 2;

  svg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  svg += `<line x1="${cx}" y1="${baseLineY}" x2="${cx + cellW}" y2="${baseLineY}" stroke="#fca5a5" stroke-width="1" stroke-dasharray="4 4"/>`;
  const d = subpathsToSvgD(g.subpaths, scale, cx + padX, baseLineY);
  svg += `<path d="${d}" fill="#0a0a0a" fill-rule="nonzero"/>`;
  const safe = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  svg += `<text x="${cx + 12}" y="${cy + 30}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#64748b">${safe} (w=${g.bbox.w.toFixed(0)})</text>`;
});

svg += `</svg>`;
fs.writeFileSync('E:/Projects/typography101-font/scripts/zoom_audit_other.png', new Resvg(svg, { fitTo: { mode: 'width', value: 2200 } }).render().asPng());
console.log('Rendered scripts/zoom_audit_other.png');
