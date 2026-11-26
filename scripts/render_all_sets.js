const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const { loadOriginalGlyphs } = require('../src/originals');
const { buildUppercaseGlyphs } = require('../src/uppercase');
const { buildNumberGlyphs } = require('../src/numbers');
const { buildPunctuationGlyphs } = require('../src/punctuation');
const { buildSpecialLetterGlyphs } = require('../src/special_letters');
const { subpathsToSvgD } = require('../src/geometry');

const orig = loadOriginalGlyphs();
const upper = buildUppercaseGlyphs();
const nums = buildNumberGlyphs();
const punct = buildPunctuationGlyphs();
const special = buildSpecialLetterGlyphs(orig, upper);
const all = { ...orig, ...upper, ...nums, ...punct, ...special };

function renderSheet(title, chars, filename, sampleLines = [], cols = 10) {
  const cellW = 300;
  const cellH = 440;
  const rows = Math.ceil(chars.length / cols);
  const gridW = cols * cellW;
  const gridH = rows * cellH;
  const headerH = 80;
  const sampleH = sampleLines.length ? sampleLines.length * 165 + 80 : 0;
  const W = gridW;
  const H = headerH + gridH + sampleH;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  svg += `<text x="30" y="54" font-family="sans-serif" font-size="36" font-weight="bold" fill="#111827">${safeTitle}</text>`;

  chars.forEach((ch, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = col * cellW;
    const cy = headerH + row * cellH;
    const baseLineY = cy + 350;
    const xHeightY = baseLineY - 216;
    const capY = baseLineY - 324;
    const descY = baseLineY + 73;

    svg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
    svg += `<line x1="${cx}" y1="${baseLineY}" x2="${cx + cellW}" y2="${baseLineY}" stroke="#ef4444" stroke-width="1" stroke-dasharray="4 4"/>`;
    svg += `<line x1="${cx}" y1="${xHeightY}" x2="${cx + cellW}" y2="${xHeightY}" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4 4"/>`;
    svg += `<line x1="${cx}" y1="${capY}" x2="${cx + cellW}" y2="${capY}" stroke="#10b981" stroke-width="1" stroke-dasharray="4 4"/>`;
    svg += `<line x1="${cx}" y1="${descY}" x2="${cx + cellW}" y2="${descY}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4 4"/>`;

    const g = all[ch];
    if (g) {
      const scale = Math.min(1, 250 / Math.max(g.bbox.w, 1), 350 / Math.max(g.bbox.maxY - g.bbox.minY, 1));
      const drawW = g.bbox.w * scale;
      const padX = (cellW - drawW) / 2;
      const d = subpathsToSvgD(g.subpaths, scale, cx + padX, baseLineY);
      svg += `<path d="${d}" fill="#111111" fill-rule="nonzero"/>`;
      const safeLabel = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      svg += `<text x="${cx + 10}" y="${cy + 26}" font-family="sans-serif" font-size="18" font-weight="bold" fill="#4b5563">${safeLabel} (${g.bbox.w.toFixed(0)})</text>`;
    }
  });

  sampleLines.forEach((text, li) => {
    const scale = 0.36;
    let x = 50;
    const y = headerH + gridH + 140 + li * 160;
    svg += `<line x1="30" y1="${y}" x2="${W - 30}" y2="${y}" stroke="#fecaca" stroke-width="1"/>`;
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
  fs.writeFileSync(`E:/Projects/typography101-font/scripts/${filename}`, resvg.render().asPng());
  console.log(`Rendered ${filename} (${chars.length} glyphs)`);
}

renderSheet(
  'NUMBERS & PUNCTUATION / SYMBOLS',
  [
    ...'0123456789'.split(''),
    ...Object.keys(punct)
  ],
  'debug_nums_punct.png',
  [
    'TYPOGRAPHY 101 — 2026!',
    'Price: $49.99 / €85.00 (100%)',
    'Hello & Welcome @Design #01?'
  ],
  10
);

renderSheet(
  'SPECIAL LETTERS & EXTENDED LATIN',
  Object.keys(special),
  'debug_special_letters.png',
  [
    'Café Crème • Übergröße • Façade',
    'Æther Œuvre Øresund España Łódź'
  ],
  10
);
