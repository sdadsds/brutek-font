const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const svg2ttf = require('svg2ttf');
const ttf2woff2Mod = require('ttf2woff2');
const ttf2woff2 = typeof ttf2woff2Mod === 'function' ? ttf2woff2Mod : ttf2woff2Mod.default;

const { loadOriginalGlyphs } = require('./originals');
const { buildUppercaseGlyphs } = require('./uppercase');
const { buildNumberGlyphs } = require('./numbers');
const { buildPunctuationGlyphs } = require('./punctuation');
const { buildSpecialLetterGlyphs } = require('./special_letters');
const { buildVietnameseGlyphs } = require('./vietnamese');
const {
  scaleSubpaths,
  translateSubpaths,
  shearSubpaths,
  subpathsToSvgD
} = require('./geometry');
const { SCALE, getSidebearings, KERN_PAIRS } = require('./metrics');

const OUT_DIST = 'E:/Projects/typography101-font/dist';
const OUT_VECTORS = 'E:/Projects/typography101-font/vectors';
fs.mkdirSync(OUT_DIST, { recursive: true });
fs.mkdirSync(path.join(OUT_VECTORS, 'glyphs'), { recursive: true });

const GLYPH_NAMES = {
  ' ': 'space',
  '!': 'exclam', '"': 'quotedbl', '#': 'numbersign', '$': 'dollar', '%': 'percent',
  '&': 'ampersand', "'": 'quotesingle', '(': 'parenleft', ')': 'parenright', '*': 'asterisk',
  '+': 'plus', ',': 'comma', '-': 'hyphen', '.': 'period', '/': 'slash',
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  ':': 'colon', ';': 'semicolon', '<': 'less', '=': 'equal', '>': 'greater',
  '?': 'question', '@': 'at', '[': 'bracketleft', '\\': 'backslash', ']': 'bracketright',
  '^': 'asciicircum', '_': 'underscore', '`': 'grave', '{': 'braceleft', '|': 'bar',
  '}': 'braceright', '~': 'asciitilde'
};

function getGlyphName(ch, g) {
  if (g && g.name) return g.name;
  if (GLYPH_NAMES[ch]) return GLYPH_NAMES[ch];
  if (/^[A-Za-z]$/.test(ch)) return ch;
  return 'uni' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
}

function subpathsToOpentypePath(subpaths) {
  const p = new opentype.Path();
  for (const sp of subpaths) {
    for (const cmd of sp) {
      if (cmd.type === 'M') p.moveTo(Math.round(cmd.x), Math.round(cmd.y));
      else if (cmd.type === 'L') p.lineTo(Math.round(cmd.x), Math.round(cmd.y));
      else if (cmd.type === 'C') {
        p.curveTo(
          Math.round(cmd.x1), Math.round(cmd.y1),
          Math.round(cmd.x2), Math.round(cmd.y2),
          Math.round(cmd.x), Math.round(cmd.y)
        );
      } else if (cmd.type === 'Z') p.close();
    }
  }
  return p;
}

function subpathsToSvgFontD(subpaths) {
  return subpaths.map(sp => sp.map(cmd => {
    if (cmd.type === 'M') return `M${Math.round(cmd.x)} ${Math.round(cmd.y)}`;
    if (cmd.type === 'L') return `L${Math.round(cmd.x)} ${Math.round(cmd.y)}`;
    if (cmd.type === 'C') return `C${Math.round(cmd.x1)} ${Math.round(cmd.y1)} ${Math.round(cmd.x2)} ${Math.round(cmd.y2)} ${Math.round(cmd.x)} ${Math.round(cmd.y)}`;
    return 'Z';
  }).join('')).join('');
}

function xmlAttrEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildFontStyle(allGlyphs, familyName, filePrefix, styleName, italicDeg = 0) {
  const isItalic = italicDeg !== 0;
  const tanAngle = isItalic ? Math.tan((italicDeg * Math.PI) / 180) : 0;
  const pivotY = 108;

  const notdefPath = new opentype.Path();
  notdefPath.moveTo(60, 0); notdefPath.lineTo(540, 0); notdefPath.lineTo(540, 810); notdefPath.lineTo(60, 810); notdefPath.close();
  notdefPath.moveTo(140, 80); notdefPath.lineTo(140, 730); notdefPath.lineTo(460, 730); notdefPath.lineTo(460, 80); notdefPath.close();

  const otGlyphs = [
    new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 600, path: notdefPath }),
    new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: 340, path: new opentype.Path() }),
    new opentype.Glyph({ name: 'nbspace', unicode: 160, advanceWidth: 340, path: new opentype.Path() }),
  ];

  const svgFontGlyphs = [];
  const glyphIndexMap = new Map();
  const sortedChars = Object.keys(allGlyphs).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));

  for (const ch of sortedChars) {
    const g = allGlyphs[ch];
    const [lsbDesign, rsbDesign] = getSidebearings(ch);
    const advanceWidth = Math.round((g.bbox.w + lsbDesign + rsbDesign) * SCALE);

    let sp = translateSubpaths(g.subpaths, lsbDesign, 0);
    if (isItalic) {
      sp = translateSubpaths(sp, 0, -pivotY);
      sp = shearSubpaths(sp, tanAngle);
      sp = translateSubpaths(sp, 0, pivotY);
    }
    sp = scaleSubpaths(sp, SCALE, SCALE);

    const gName = getGlyphName(ch, g);
    const unicode = ch.codePointAt(0);
    const otPath = subpathsToOpentypePath(sp);

    glyphIndexMap.set(ch, otGlyphs.length);
    otGlyphs.push(new opentype.Glyph({
      name: gName,
      unicode,
      advanceWidth,
      path: otPath
    }));

    const dSvgFont = subpathsToSvgFontD(sp);
    svgFontGlyphs.push(
      `      <glyph glyph-name="${xmlAttrEscape(gName)}" unicode="&#x${unicode.toString(16).toUpperCase()};" horiz-adv-x="${advanceWidth}" d="${dSvgFont}" />`
    );
  }

  // Generous vertical metrics (ascender 1180, descender -300) so stacked uppercase Vietnamese tones
  // (Ắ, Ầ, Ể, Ỗ, Ự) and ỵ dot-below NEVER clip in Windows, Illustrator, Figma, or browsers!
  const font = new opentype.Font({
    familyName,
    styleName,
    unitsPerEm: 1000,
    ascender: 1180,
    descender: -300,
    glyphs: otGlyphs,
    copyright: 'Copyright (c) 2026 Dieu Anh (https://github.com/sdadsds/typography101-font), with Reserved Font Name "Typography101" and "Typography101 VN".',
    designer: 'Dieu Anh',
    designerURL: 'https://github.com/sdadsds/typography101-font',
    license: 'This Font Software is licensed under the SIL Open Font License, Version 1.1. Available at https://openfontlicense.org',
    licenseURL: 'https://openfontlicense.org',
    version: 'Version 1.100'
  });

  font.tables.os2 = font.tables.os2 || {};
  font.tables.os2.sxHeight = 540;
  font.tables.os2.sCapHeight = 810;
  font.tables.os2.sTypoAscender = 840;
  font.tables.os2.sTypoDescender = -200;
  font.tables.os2.sTypoLineGap = 280;
  font.tables.os2.usWinAscent = 1180;
  font.tables.os2.usWinDescent = 300;
  font.tables.os2.usWeightClass = 800;
  font.tables.os2.fsSelection = isItalic ? 0x0001 : 0x0040;
  // Set Vietnamese code page bit (bit 8 in ulCodePageRange1 = Windows 1258 Vietnamese + bit 0 Latin 1 + bit 1 Latin 2)
  font.tables.os2.ulCodePageRange1 = 0x00000103;
  font.tables.head = font.tables.head || {};
  font.tables.head.macStyle = isItalic ? 0x0002 : 0x0000;
  font.tables.post = font.tables.post || {};
  font.tables.post.italicAngle = isItalic ? -italicDeg : 0;
  font.tables.hhea = font.tables.hhea || {};
  font.tables.hhea.ascender = 1180;
  font.tables.hhea.descender = -300;
  font.tables.hhea.lineGap = 0;

  font.kerningPairs = {};
  for (const [l, r, val] of KERN_PAIRS) {
    const li = glyphIndexMap.get(l);
    const ri = glyphIndexMap.get(r);
    if (li !== undefined && ri !== undefined) {
      font.kerningPairs[`${li},${ri}`] = val;
    }
  }

  const baseName = `${filePrefix}-${styleName}`;
  const otfBuf = Buffer.from(font.toArrayBuffer());
  fs.writeFileSync(path.join(OUT_DIST, `${baseName}.otf`), otfBuf);

  const kernXml = KERN_PAIRS
    .filter(([l, r]) => allGlyphs[l] && allGlyphs[r])
    .map(([l, r, v]) => {
      const lu = `&#x${l.codePointAt(0).toString(16).toUpperCase()};`;
      const ru = `&#x${r.codePointAt(0).toString(16).toUpperCase()};`;
      return `      <hkern u1="${lu}" u2="${ru}" k="${-v}" />`;
    }).join('\n');

  const svgFontXml = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="${baseName}" horiz-adv-x="600">
      <font-face
        font-family="${xmlAttrEscape(familyName)}"
        font-style="${styleName}"
        font-weight="800"
        units-per-em="1000"
        ascent="1180"
        descent="-300"
        x-height="540"
        cap-height="810"
        bbox="-140 -300 1120 1180"
      />
      <missing-glyph horiz-adv-x="600" d="M60 0L540 0L540 810L60 810ZM140 80L140 730L460 730L460 80Z" />
      <glyph glyph-name="space" unicode="&#x20;" horiz-adv-x="340" d="" />
      <glyph glyph-name="nbspace" unicode="&#xA0;" horiz-adv-x="340" d="" />
${svgFontGlyphs.join('\n')}
${kernXml}
    </font>
  </defs>
</svg>`;

  const ttfResult = svg2ttf(svgFontXml, {
    copyright: 'Copyright (c) 2026 Dieu Anh — SIL Open Font License 1.1 (https://openfontlicense.org)',
    description: 'Complete modular typeface derived from TYPOGRAPHY101.ai with full Vietnamese keyboard support (OFL-1.1)',
    url: 'https://github.com/sdadsds/typography101-font',
    subfamily: styleName,
    version: '1.1'
  });
  const ttfBuf = Buffer.from(ttfResult.buffer);
  fs.writeFileSync(path.join(OUT_DIST, `${baseName}.ttf`), ttfBuf);

  let woff2Size = 0;
  try {
    const woff2Buf = Buffer.from(ttf2woff2(ttfBuf));
    fs.writeFileSync(path.join(OUT_DIST, `${baseName}.woff2`), woff2Buf);
    woff2Size = woff2Buf.length;
  } catch (e) {
    console.warn(`WOFF2 note for ${baseName}:`, e.message);
  }

  console.log(`Built ${baseName} ("${familyName}" ${styleName}): ${otGlyphs.length} glyphs | OTF=${otfBuf.length}B | TTF=${ttfBuf.length}B | WOFF2=${woff2Size}B`);
}

function exportVectorSets(sets) {
  function writeVectorSheet(filename, title, subtitle, glyphsObj, cols = 10) {
    const chars = Object.keys(glyphsObj);
    const cellW = 300;
    const cellH = 440;
    const rows = Math.ceil(chars.length / cols);
    const headerH = 110;
    const W = cols * cellW + 80;
    const H = headerH + rows * cellH + 60;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n`;
    svg += `  <rect width="100%" height="100%" fill="#ffffff"/>\n`;
    svg += `  <text x="40" y="54" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#0f172a">${xmlAttrEscape(title)}</text>\n`;
    svg += `  <text x="40" y="86" font-family="Arial, sans-serif" font-size="18" fill="#64748b">${xmlAttrEscape(subtitle)}</text>\n`;

    chars.forEach((ch, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = 40 + col * cellW;
      const cy = headerH + row * cellH;
      const baseLineY = cy + 335;
      const g = glyphsObj[ch];
      const scale = Math.min(0.76, 220 / Math.max(g.bbox.w, 1), 280 / Math.max(g.bbox.maxY - g.bbox.minY, 1));
      const padX = (cellW - g.bbox.w * scale) / 2;
      const d = subpathsToSvgD(g.subpaths, scale, cx + padX, baseLineY);
      const gName = getGlyphName(ch, g);

      svg += `  <g id="glyph-${xmlAttrEscape(gName)}">\n`;
      svg += `    <rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="none" stroke="#f1f5f9" stroke-width="1"/>\n`;
      svg += `    <path d="${d}" fill="#000000" fill-rule="nonzero"/>\n`;
      svg += `    <text x="${cx + 12}" y="${cy + 26}" font-family="monospace" font-size="14" fill="#94a3b8">${xmlAttrEscape(gName)} (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})</text>\n`;
      svg += `  </g>\n`;
    });

    svg += `</svg>\n`;
    fs.writeFileSync(path.join(OUT_VECTORS, filename), svg, 'utf8');
  }

  writeVectorSheet('set1-original-lowercase.svg', 'TYPOGRAPHY101 — Set 1: Original Lowercase (a–z) + Emblem', 'Losslessly extracted vector outlines from TYPOGRAPHY101.ai', sets.orig, 7);
  writeVectorSheet('set2-capitalizations.svg', 'TYPOGRAPHY101 — Set 2: Capitalizations (A–Z)', 'Clean modular uppercase alphabet faithful to TYPOGRAPHY101', sets.upper, 7);
  writeVectorSheet('set3-numbers.svg', 'TYPOGRAPHY101 — Set 3: Numbers (0–9)', 'Cleaned lining display numerals at cap height (324u)', sets.nums, 5);
  writeVectorSheet('set4-special-letters.svg', 'TYPOGRAPHY101 — Set 4: Special Letters & Extended Latin', 'Bespoke ligatures & special letters + European accented letters', sets.special, 10);
  writeVectorSheet('set5-punctuation-and-symbols.svg', 'TYPOGRAPHY101 — Set 5: Punctuation, Currency & Symbols', 'Matching punctuation, brackets, math, currency, and display symbols', sets.punct, 10);

  // Full Vietnamese alphabet sheet (ordered logically by vowel family!)
  const vnOrder = [
    'Đ','đ','₫',
    'À','Á','Ả','Ã','Ạ','à','á','ả','ã','ạ',
    'Ă','Ằ','Ắ','Ẳ','Ẵ','Ặ','ă','ằ','ắ','ẳ','ẵ','ặ',
    'Â','Ầ','Ấ','Ẩ','Ẫ','Ậ','â','ầ','ấ','ẩ','ẫ','ậ',
    'È','É','Ẻ','Ẽ','Ẹ','è','é','ẻ','ẽ','ẹ',
    'Ê','Ề','Ế','Ể','Ễ','Ệ','ê','ề','ế','ể','ễ','ệ',
    'Ì','Í','Ỉ','Ĩ','Ị','ì','í','ỉ','ĩ','ị',
    'Ò','Ó','Ỏ','Õ','Ọ','ò','ó','ỏ','õ','ọ',
    'Ô','Ồ','Ố','Ổ','Ỗ','Ộ','ô','ồ','ố','ổ','ỗ','ộ',
    'Ơ','Ờ','Ớ','Ở','Ỡ','Ợ','ơ','ờ','ớ','ở','ỡ','ợ',
    'Ù','Ú','Ủ','Ũ','Ụ','ù','ú','ủ','ũ','ụ',
    'Ư','Ừ','Ứ','Ử','Ữ','Ự','ư','ừ','ứ','ử','ữ','ự',
    'Ỳ','Ý','Ỷ','Ỹ','Ỵ','ỳ','ý','ỷ','ỹ','ỵ'
  ];
  const allCombined = { ...sets.orig, ...sets.upper, ...sets.nums, ...sets.punct, ...sets.special, ...sets.vn };
  const vnOrderedObj = {};
  for (const ch of vnOrder) if (allCombined[ch]) vnOrderedObj[ch] = allCombined[ch];
  writeVectorSheet(
    'set6-vietnamese.svg',
    'TYPOGRAPHY101 VN — Set 6: Complete Vietnamese Keyboard Set (Telex / VNI)',
    'All 135 Vietnamese characters: Đ/đ, ₫, and all 6 tones across A Ă Â E Ê I O Ô Ơ U Ư Y (upper & lower)',
    vnOrderedObj,
    12
  );

  // Export individual clean Illustrator-ready SVGs
  for (const [ch, g] of Object.entries(allCombined)) {
    const gName = getGlyphName(ch, g);
    const pad = 20;
    const w = Math.ceil(g.bbox.w + pad * 2);
    const h = 620;
    const baselineY = 470;
    const d = subpathsToSvgD(g.subpaths, 1, pad, baselineY);
    const singleSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  <path id="${xmlAttrEscape(gName)}" d="${d}" fill="#000000" fill-rule="nonzero"/>\n</svg>\n`;
    fs.writeFileSync(path.join(OUT_VECTORS, 'glyphs', `${gName}.svg`), singleSvg, 'utf8');
  }
  console.log(`Exported 6 organized vector set sheets + ${Object.keys(allCombined).length} individual SVGs to ${OUT_VECTORS}`);
}

function main() {
  const orig = loadOriginalGlyphs();
  const upper = buildUppercaseGlyphs();
  const nums = buildNumberGlyphs();
  const punct = buildPunctuationGlyphs();
  const special = buildSpecialLetterGlyphs(orig, upper);
  const vn = buildVietnameseGlyphs(orig, upper);

  // Unified complete glyph map (Vietnamese overlays seamlessly with European Latin!)
  const allGlyphs = { ...orig, ...upper, ...nums, ...punct, ...special, ...vn };
  console.log(`Total glyphs assembled: ${Object.keys(allGlyphs).length}`);
  console.log(`  - Original lowercase + dotless + emblem/alt: ${Object.keys(orig).length}`);
  console.log(`  - Uppercase A-Z: ${Object.keys(upper).length}`);
  console.log(`  - Numbers 0-9: ${Object.keys(nums).length}`);
  console.log(`  - Punctuation & Symbols: ${Object.keys(punct).length}`);
  console.log(`  - Special & Extended Latin: ${Object.keys(special).length}`);
  console.log(`  - Vietnamese Keyboard Additions (Đ/đ/₫ + Ă/Â/Ê/Ô/Ơ/Ư + 6 tones): ${Object.keys(vn).length}`);

  // 1. Main complete family (includes full English + European + Vietnamese support!)
  buildFontStyle(allGlyphs, 'Typography101', 'Typography101', 'Regular', 0);
  buildFontStyle(allGlyphs, 'Typography101', 'Typography101', 'Italic', 20);

  // 2. Dedicated Vietnamese Edition family ("Typography101 VN") for direct Vietnamese keyboard workflows
  buildFontStyle(allGlyphs, 'Typography101 VN', 'Typography101VN', 'Regular', 0);
  buildFontStyle(allGlyphs, 'Typography101 VN', 'Typography101VN', 'Italic', 20);

  exportVectorSets({ orig, upper, nums, punct, special, vn });
}

main();
