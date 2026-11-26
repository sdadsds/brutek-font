const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const { loadOriginalGlyphs } = require('../src/originals');
const { buildUppercaseGlyphs } = require('../src/uppercase');
const { subpathsToSvgD } = require('../src/geometry');

const orig = loadOriginalGlyphs();
const upper = buildUppercaseGlyphs();
const all = { ...orig, ...upper };

// Render A-Z grid + sample mixed-case lines
const cols = 7;
const cellW = 340;
const cellH = 440;
const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const rows = Math.ceil(keys.length / cols);
const gridW = cols * cellW;
const gridH = rows * cellH;
const sampleH = 560;
const W = gridW;
const H = gridH + sampleH;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;

keys.forEach((ch, idx) => {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const cx = col * cellW;
  const cy = row * cellH;
  const baseLineY = cy + 360;
  const xHeightY = baseLineY - 216;
  const capY = baseLineY - 324;
  const descY = baseLineY + 73;

  svg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
  svg += `<line x1="${cx}" y1="${baseLineY}" x2="${cx + cellW}" y2="${baseLineY}" stroke="#ef4444" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<line x1="${cx}" y1="${xHeightY}" x2="${cx + cellW}" y2="${xHeightY}" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<line x1="${cx}" y1="${capY}" x2="${cx + cellW}" y2="${capY}" stroke="#10b981" stroke-width="1" stroke-dasharray="4 4"/>`;
  svg += `<line x1="${cx}" y1="${descY}" x2="${cx + cellW}" y2="${descY}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4 4"/>`;

  const g = upper[ch];
  const gw = g.bbox.w;
  const padX = (cellW - gw) / 2;
  const d = subpathsToSvgD(g.subpaths, 1, cx + padX, baseLineY);
  svg += `<path d="${d}" fill="#111111" fill-rule="nonzero"/>`;
  svg += `<text x="${cx + 10}" y="${cy + 26}" font-family="sans-serif" font-size="20" font-weight="bold" fill="#4b5563">${ch} (${gw.toFixed(0)}x${g.bbox.h.toFixed(0)})</text>`;
});

// Render sample lines comparing Uppercase + Original Lowercase!
const lines = [
  'Typography Design',
  'Hamburgefonstiv',
  'Aa Bb Cc Dd Ee Ff Gg Hh'
];

lines.forEach((text, li) => {
  const scale = 0.42;
  let x = 60;
  const y = gridH + 150 + li * 175;
  svg += `<line x1="40" y1="${y}" x2="${W - 40}" y2="${y}" stroke="#fecaca" stroke-width="1"/>`;
  for (const ch of text) {
    if (ch === ' ') { x += 110 * scale; continue; }
    const g = all[ch];
    if (!g) continue;
    const d = subpathsToSvgD(g.subpaths, scale, x, y);
    svg += `<path d="${d}" fill="#0a0a0a" fill-rule="nonzero"/>`;
    x += (g.bbox.w + 34) * scale;
  }
});

svg += `</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 2000 } });
fs.writeFileSync('E:/Projects/typography101-font/scripts/debug_uppercase.png', resvg.render().asPng());
console.log('Rendered debug_uppercase.png');
