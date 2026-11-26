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

// Programmatic micro-segment / seam detector across all designed glyphs!
function auditGeometry(name, glyphsObj) {
  const issues = [];
  for (const [ch, g] of Object.entries(glyphsObj)) {
    for (let si = 0; si < g.subpaths.length; si++) {
      const sp = g.subpaths[si];
      let prev = null;
      for (const cmd of sp) {
        if (cmd.type === 'M') { prev = [cmd.x, cmd.y]; continue; }
        if (cmd.type === 'Z') continue;
        const len = Math.hypot(cmd.x - prev[0], cmd.y - prev[1]);
        if (len > 0.05 && len < 6.0 && cmd.type === 'L') {
          issues.push(`${ch} (${g.name || ch}): tiny line len=${len.toFixed(2)} at (${prev[0].toFixed(1)},${prev[1].toFixed(1)})->(${cmd.x.toFixed(1)},${cmd.y.toFixed(1)})`);
        }
        prev = [cmd.x, cmd.y];
      }
    }
  }
  console.log(`=== ${name} micro-line audit: ${issues.length} findings ===`);
  issues.forEach(s => console.log('  ', s));
}

auditGeometry('UPPERCASE', upper);
auditGeometry('NUMBERS', nums);
auditGeometry('PUNCTUATION', punct);
auditGeometry('SPECIAL_BESPOKE', Object.fromEntries(
  ['ß','Æ','æ','Œ','œ','Ø','ø','Ð','ð','Þ','þ','Ł','ł'].map(k => [k, special[k]])
));

function renderZoom(chars, srcObj, outPath, cols = 7) {
  const rows = Math.ceil(chars.length / cols);
  const cellW = 380, cellH = 440;
  const W = cols * cellW, H = rows * cellH;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
  chars.forEach((ch, idx) => {
    const col = idx % cols, row = Math.floor(idx / cols);
    const cx = col * cellW, cy = row * cellH;
    const baseY = cy + 365;
    const g = srcObj[ch];
    if (!g) return;
    const scale = Math.min(1.0, 310 / Math.max(g.bbox.w, 1), 320 / Math.max(g.bbox.maxY - g.bbox.minY, 1));
    const padX = (cellW - g.bbox.w * scale) / 2;
    svg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
    svg += `<line x1="${cx}" y1="${baseY}" x2="${cx + cellW}" y2="${baseY}" stroke="#fca5a5" stroke-width="1" stroke-dasharray="4 4"/>`;
    svg += `<path d="${subpathsToSvgD(g.subpaths, scale, cx + padX, baseY)}" fill="#0a0a0a" fill-rule="nonzero"/>`;
    const safe = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    svg += `<text x="${cx + 12}" y="${cy + 28}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#64748b">${safe}</text>`;
  });
  svg += `</svg>`;
  fs.writeFileSync(outPath, new Resvg(svg, { fitTo: { mode: 'width', value: 2300 } }).render().asPng());
}

renderZoom('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), upper, 'E:/Projects/typography101-font/scripts/zoom_all_uppercase.png', 7);
renderZoom(Object.keys(punct), punct, 'E:/Projects/typography101-font/scripts/zoom_all_punctuation.png', 9);
console.log('Rendered zoom_all_uppercase.png and zoom_all_punctuation.png');
