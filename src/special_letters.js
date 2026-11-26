const {
  rrect,
  asymSlit,
  rpoly,
  circle,
  smoothWaistCut,
  uniteAll,
  subtractAll,
  subpathsToPaper,
  paperToSubpaths,
  translateSubpaths,
  bboxOfSubpaths,
  cleanupScope
} = require('./geometry');

const { CAP_H, STEM, BAR, SLIT } = require('./uppercase');

/**
 * TYPOGRAPHY101 Special Letters & Extended Latin Set
 * Includes:
 * 1. Unique bespoke special letterforms: ß, Æ, æ, Œ, œ, Ø, ø, Ð, ð, Þ, þ, Ł, ł
 * 2. Modular geometric diacritics matching the exact i/j tittle DNA:
 *    acute (´), grave (`), circumflex (^), tilde (~), dieresis (¨), ring (°), cedilla (¸), caron (ˇ), macron (¯)
 * 3. Complete Western & Central European accented Uppercase + Lowercase set (À-ÿ, Š, š, Ž, ž, Ÿ)
 */

function makeSpecial(char, name, buildFn) {
  cleanupScope();
  const item = buildFn();
  let subpaths = paperToSubpaths(item);
  const bb = bboxOfSubpaths(subpaths);
  if (Math.abs(bb.minX) > 0.01) {
    subpaths = translateSubpaths(subpaths, -bb.minX, 0);
  }
  return {
    char,
    name,
    subpaths,
    bbox: bboxOfSubpaths(subpaths),
    source: 'designed-special-letters'
  };
}

// Modular diacritics positioned around (cx, baseY) where baseY = top of glyph + gap
function buildDiacritic(type, cx, baseY) {
  switch (type) {
    case 'acute':
      return rpoly([
        [cx - 18, baseY, 10],
        [cx + 18, baseY, 6],
        [cx + 58, baseY + 58, 14],
        [cx + 6, baseY + 58, 8]
      ]);
    case 'grave':
      return rpoly([
        [cx - 58, baseY + 58, 14],
        [cx - 6, baseY + 58, 8],
        [cx + 18, baseY, 10],
        [cx - 18, baseY, 6]
      ]);
    case 'circumflex':
      return rpoly([
        [cx - 64, baseY, 8],
        [cx, baseY + 62, 12],
        [cx + 64, baseY, 8],
        [cx + 28, baseY, 4],
        [cx, baseY + 28, 6],
        [cx - 28, baseY, 4]
      ]);
    case 'caron':
      return rpoly([
        [cx - 64, baseY + 62, 8],
        [cx - 28, baseY + 62, 4],
        [cx, baseY + 34, 6],
        [cx + 28, baseY + 62, 4],
        [cx + 64, baseY + 62, 8],
        [cx, baseY, 12]
      ]);
    case 'dieresis':
      // Twin mini i-tittle asymmetric pills!
      return uniteAll([
        rrect(cx - 72, baseY, 60, 42, { tl: 4, tr: 18, br: 4, bl: 18 }),
        rrect(cx + 12, baseY, 60, 42, { tl: 4, tr: 18, br: 4, bl: 18 })
      ]);
    case 'tilde':
      return rpoly([
        [cx - 68, baseY + 24, 10],
        [cx - 22, baseY + 58, 14],
        [cx + 24, baseY + 32, 8],
        [cx + 68, baseY + 56, 10],
        [cx + 68, baseY + 24, 10],
        [cx + 22, baseY - 2, 14],
        [cx - 24, baseY + 24, 8],
        [cx - 68, baseY, 10]
      ]);
    case 'ring':
      return subtractAll(
        rrect(cx - 42, baseY, 84, 72, { tl: 22, tr: 22, br: 22, bl: 22 }),
        [asymSlit(cx - 12, baseY + 14, 24, 44, 10, 3)]
      );
    case 'macron':
      // Exact i-tittle pill!
      return rrect(cx - 56, baseY + 4, 112, 36, { tl: 4, tr: 18, br: 4, bl: 18 });
    case 'cedilla':
      return rpoly([
        [cx - 14, 4, 0],
        [cx + 18, 4, 0],
        [cx + 38, -46, 14],
        [cx - 24, -68, 14],
        [cx - 32, -40, 10],
        [cx + 6, -34, 6]
      ]);
    default:
      return null;
  }
}

function buildSpecialLetterGlyphs(origGlyphs, upperGlyphs) {
  const g = {};
  const allBase = { ...origGlyphs, ...upperGlyphs };

  // ==========================================
  // 1. BESPOKE SPECIAL LETTERS (ß, Æ, æ, Œ, œ, Ø, ø, Ð, ð, Þ, þ, Ł, ł)
  // ==========================================

  // ß (German Eszett — smooth C1-tangent waist curve, clean open lower channel, zero kinks!)
  g['\u00DF'] = makeSpecial('\u00DF', 'germandbls', () => {
    const w = 236;
    const h = 327;
    const midY = 172;
    const outer = rrect(0, 0, w, h, { tl: 48, tr: 36, br: 38, bl: 24 });
    const waistR = smoothWaistCut(w, midY, 10, 56, 'right');
    const topHole = asymSlit(94, midY + 14, 38, (h - 28) - (midY + 14), 24, 5);
    const botChannel = rrect(94, -10, 38, (midY - 14) + 10, { tl: 24, tr: 5 });
    const rightLobeFoot = subtractAll(
      rrect(132, 0, 22, 22),
      [rrect(132, 0, 44, 44, { bl: 22 })]
    );
    return subtractAll(outer, [waistR, topHole, botChannel, rightLobeFoot]);
  });

  // Æ (Uppercase AE ligature — chamfered A left + fused E right!)
  g['\u00C6'] = makeSpecial('\u00C6', 'AE', () => {
    const aPart = rpoly([
      [0, 0, 0], [186, 0, 0], [186, CAP_H, 0],
      [96, CAP_H, 16], [0, 178, 12]
    ]);
    const aFix = subtractAll(aPart, [
      subtractAll(rrect(0, 0, 24, 24), [rrect(0, 0, 48, 48, { bl: 24 })]),
      asymSlit(88, 134, 36, 150, 22, 5),
      rrect(88, -10, 36, 114, { tl: 22, tr: 5 })
    ]);
    // E half fused at x=124..348
    const eX = 124, eW = 224, midY = 148;
    const eOuter = rrect(eX, 0, eW, CAP_H, { tl: 0, tr: 26, br: 26, bl: 0 });
    const tSlit = rrect(eX + 94, midY + BAR, 36, CAP_H - BAR - (midY + BAR), { tl: 24, tr: 5, br: 12, bl: 5 });
    const tOpen = rrect(eX + 108, midY + BAR, eW - 94, (CAP_H - 68) - (midY + BAR), { tl: 12 });
    const bSlit = rrect(eX + 94, BAR, 36, midY - BAR, { tl: 5, tr: 12, br: 24, bl: 5 });
    const bOpen = rrect(eX + 108, 68, eW - 94, midY - 68, { bl: 12 });
    const midTrim = rrect(eX + eW - 40, midY - 2, 50, BAR + 4);
    const ePart = uniteAll([
      subtractAll(eOuter, [uniteAll([tSlit, tOpen]), uniteAll([bSlit, bOpen]), midTrim]),
      rrect(eX + 94, midY, eW - 110, BAR, { tr: 14, br: 6 })
    ]);
    return uniteAll([aFix, ePart]);
  });

  // æ (Lowercase ae ligature — built directly from original a & e fused cleanly!)
  g['\u00E6'] = makeSpecial('\u00E6', 'ae', () => {
    const aItem = subpathsToPaper(origGlyphs.a.subpaths);
    const eItem = subpathsToPaper(translateSubpaths(origGlyphs.e.subpaths, 123, 0));
    return uniteAll([aItem, eItem]);
  });

  // Œ (Uppercase OE ligature — O fused with E!)
  g['\u0152'] = makeSpecial('\u0152', 'OE', () => {
    const oItem = subpathsToPaper(upperGlyphs.O.subpaths);
    const eItem = subpathsToPaper(translateSubpaths(upperGlyphs.E.subpaths, 144, 0));
    // Re-carve O's hole cleanly after union
    const oHole = asymSlit(102, BAR, 40, CAP_H - 2 * BAR, 28, 5);
    return subtractAll(uniteAll([oItem, eItem]), [oHole]);
  });

  // œ (Lowercase oe ligature — original o fused with original e!)
  g['\u0153'] = makeSpecial('\u0153', 'oe', () => {
    const oItem = subpathsToPaper(origGlyphs.o.subpaths);
    const eItem = subpathsToPaper(translateSubpaths(origGlyphs.e.subpaths, 123, 0));
    return uniteAll([oItem, eItem]);
  });

  // Ø (Uppercase O with crisp diagonal stroke!)
  g['\u00D8'] = makeSpecial('\u00D8', 'Oslash', () => {
    const oItem = subpathsToPaper(upperGlyphs.O.subpaths);
    const slash = rpoly([
      [212, CAP_H + 22, 8],
      [252, CAP_H + 22, 8],
      [32, -22, 8],
      [-8, -22, 8]
    ]);
    return uniteAll([oItem, slash]);
  });

  // ø (Lowercase o with crisp diagonal stroke!)
  g['\u00F8'] = makeSpecial('\u00F8', 'oslash', () => {
    const oItem = subpathsToPaper(origGlyphs.o.subpaths);
    const slash = rpoly([
      [186, 238, 8],
      [220, 238, 8],
      [30, -22, 8],
      [-4, -22, 8]
    ]);
    return uniteAll([oItem, slash]);
  });

  // Ð (Uppercase Eth — D + bold left crossbar!)
  g['\u00D0'] = makeSpecial('\u00D0', 'Eth', () => {
    const dItem = subpathsToPaper(translateSubpaths(upperGlyphs.D.subpaths, 34, 0));
    const bar = rrect(0, 148, 124, 28, { tl: 6, tr: 12, br: 6, bl: 12 });
    return uniteAll([dItem, bar]);
  });

  // ð (Lowercase eth — original o-bowl + sweeping curved top-left ascender + crossbar!)
  g['\u00F0'] = makeSpecial('\u00F0', 'eth', () => {
    const oItem = subpathsToPaper(origGlyphs.o.subpaths);
    const neck = rpoly([
      [123, 180, 0], [216, 180, 0],
      [196, 294, 20], [56, 327, 20], [56, 288, 14], [134, 266, 10]
    ]);
    const cross = rpoly([
      [104, 236, 6], [220, 298, 8], [204, 324, 8], [88, 262, 6]
    ]);
    return uniteAll([oItem, neck, cross]);
  });

  // Þ (Uppercase Thorn — heavy stem + centered P-bowl!)
  g['\u00DE'] = makeSpecial('\u00DE', 'Thorn', () => {
    const w = 240;
    const stem = rrect(0, 0, STEM, CAP_H, { tl: 0, tr: 24, br: 0, bl: 24 });
    const bowl = rrect(0, 62, w, 200, { tr: 30, br: 30 });
    const hole = asymSlit(STEM, 62 + BAR, SLIT, 200 - 2 * BAR, 26, 5);
    return subtractAll(uniteAll([stem, bowl]), [hole]);
  });

  // þ (Lowercase thorn — original p + ascender stem!)
  g['\u00FE'] = makeSpecial('\u00FE', 'thorn', () => {
    const pItem = subpathsToPaper(origGlyphs.p.subpaths);
    const asc = rrect(0, 180, 94, 147, { tl: 24, tr: 0 });
    return uniteAll([pItem, asc]);
  });

  // Ł (Uppercase L with slash)
  g['\u0141'] = makeSpecial('\u0141', 'Lslash', () => {
    const lItem = subpathsToPaper(translateSubpaths(upperGlyphs.L.subpaths, 24, 0));
    const slash = rpoly([[0, 134, 8], [148, 212, 8], [148, 244, 8], [0, 166, 8]]);
    return uniteAll([lItem, slash]);
  });

  // ł (Lowercase l with slash)
  g['\u0142'] = makeSpecial('\u0142', 'lslash', () => {
    const lItem = subpathsToPaper(translateSubpaths(origGlyphs.l.subpaths, 24, 0));
    const slash = rpoly([[0, 134, 8], [142, 204, 8], [142, 234, 8], [0, 164, 8]]);
    return uniteAll([lItem, slash]);
  });

  // ==========================================
  // 2. COMPOSITE ACCENTED LETTERS (Uppercase + Lowercase)
  // ==========================================
  const composites = [
    // Uppercase A
    ['\u00C0', 'Agrave', 'A', 'grave'],
    ['\u00C1', 'Aacute', 'A', 'acute'],
    ['\u00C2', 'Acircumflex', 'A', 'circumflex'],
    ['\u00C3', 'Atilde', 'A', 'tilde'],
    ['\u00C4', 'Adieresis', 'A', 'dieresis'],
    ['\u00C5', 'Aring', 'A', 'ring'],
    // Uppercase C, E
    ['\u00C7', 'Ccedilla', 'C', 'cedilla'],
    ['\u00C8', 'Egrave', 'E', 'grave'],
    ['\u00C9', 'Eacute', 'E', 'acute'],
    ['\u00CA', 'Ecircumflex', 'E', 'circumflex'],
    ['\u00CB', 'Edieresis', 'E', 'dieresis'],
    // Uppercase I, N, O
    ['\u00CC', 'Igrave', 'I', 'grave'],
    ['\u00CD', 'Iacute', 'I', 'acute'],
    ['\u00CE', 'Icircumflex', 'I', 'circumflex'],
    ['\u00CF', 'Idieresis', 'I', 'dieresis'],
    ['\u00D1', 'Ntilde', 'N', 'tilde'],
    ['\u00D2', 'Ograve', 'O', 'grave'],
    ['\u00D3', 'Oacute', 'O', 'acute'],
    ['\u00D4', 'Ocircumflex', 'O', 'circumflex'],
    ['\u00D5', 'Otilde', 'O', 'tilde'],
    ['\u00D6', 'Odieresis', 'O', 'dieresis'],
    // Uppercase U, Y, S, Z
    ['\u00D9', 'Ugrave', 'U', 'grave'],
    ['\u00DA', 'Uacute', 'U', 'acute'],
    ['\u00DB', 'Ucircumflex', 'U', 'circumflex'],
    ['\u00DC', 'Udieresis', 'U', 'dieresis'],
    ['\u00DD', 'Yacute', 'Y', 'acute'],
    ['\u0178', 'Ydieresis', 'Y', 'dieresis'],
    ['\u0160', 'Scaron', 'S', 'caron'],
    ['\u017D', 'Zcaron', 'Z', 'caron'],

    // Lowercase a (using ORIGINAL a!)
    ['\u00E0', 'agrave', 'a', 'grave'],
    ['\u00E1', 'aacute', 'a', 'acute'],
    ['\u00E2', 'acircumflex', 'a', 'circumflex'],
    ['\u00E3', 'atilde', 'a', 'tilde'],
    ['\u00E4', 'adieresis', 'a', 'dieresis'],
    ['\u00E5', 'aring', 'a', 'ring'],
    // Lowercase c, e
    ['\u00E7', 'ccedilla', 'c', 'cedilla'],
    ['\u00E8', 'egrave', 'e', 'grave'],
    ['\u00E9', 'eacute', 'e', 'acute'],
    ['\u00EA', 'ecircumflex', 'e', 'circumflex'],
    ['\u00EB', 'edieresis', 'e', 'dieresis'],
    // Lowercase i (using dotless i extracted from original i!)
    ['\u00EC', 'igrave', '\u0131', 'grave'],
    ['\u00ED', 'iacute', '\u0131', 'acute'],
    ['\u00EE', 'icircumflex', '\u0131', 'circumflex'],
    ['\u00EF', 'idieresis', '\u0131', 'dieresis'],
    // Lowercase n, o
    ['\u00F1', 'ntilde', 'n', 'tilde'],
    ['\u00F2', 'ograve', 'o', 'grave'],
    ['\u00F3', 'oacute', 'o', 'acute'],
    ['\u00F4', 'ocircumflex', 'o', 'circumflex'],
    ['\u00F5', 'otilde', 'o', 'tilde'],
    ['\u00F6', 'odieresis', 'o', 'dieresis'],
    // Lowercase u, y, s, z
    ['\u00F9', 'ugrave', 'u', 'grave'],
    ['\u00FA', 'uacute', 'u', 'acute'],
    ['\u00FB', 'ucircumflex', 'u', 'circumflex'],
    ['\u00FC', 'udieresis', 'u', 'dieresis'],
    ['\u00FD', 'yacute', 'y', 'acute'],
    ['\u00FF', 'ydieresis', 'y', 'dieresis'],
    ['\u0161', 'scaron', 's', 'caron'],
    ['\u017E', 'zcaron', 'z', 'caron'],
    // Additional Central/Eastern European & Macron special letters
    ['\u0106', 'Cacute', 'C', 'acute'],
    ['\u0107', 'cacute', 'c', 'acute'],
    ['\u0143', 'Nacute', 'N', 'acute'],
    ['\u0144', 'nacute', 'n', 'acute'],
    ['\u015A', 'Sacute', 'S', 'acute'],
    ['\u015B', 'sacute', 's', 'acute'],
    ['\u0179', 'Zacute', 'Z', 'acute'],
    ['\u017A', 'zacute', 'z', 'acute'],
    ['\u0100', 'Amacron', 'A', 'macron'],
    ['\u0101', 'amacron', 'a', 'macron'],
    ['\u0112', 'Emacron', 'E', 'macron'],
    ['\u0113', 'emacron', 'e', 'macron'],
    ['\u012A', 'Imacron', 'I', 'macron'],
    ['\u012B', 'imacron', '\u0131', 'macron'],
    ['\u014C', 'Omacron', 'O', 'macron'],
    ['\u014D', 'omacron', 'o', 'macron'],
    ['\u016A', 'Umacron', 'U', 'macron'],
    ['\u016B', 'umacron', 'u', 'macron'],
  ];

  for (const [ch, name, baseCh, accent] of composites) {
    const baseGlyph = allBase[baseCh];
    if (!baseGlyph) continue;
    g[ch] = makeSpecial(ch, name, () => {
      const baseItem = subpathsToPaper(baseGlyph.subpaths);
      const cx = baseGlyph.bbox.w / 2;
      const topY = baseGlyph.bbox.maxY;
      const gap = accent === 'cedilla' ? 0 : 18;
      const mark = buildDiacritic(accent, cx, topY + gap);
      if (accent === 'cedilla') {
        return uniteAll([baseItem, mark]);
      }
      // Keep base + mark as clean disjoint contours (or union if touching)
      return uniteAll([baseItem, mark]);
    });
  }

  return g;
}

module.exports = { buildSpecialLetterGlyphs };
