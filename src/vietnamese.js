const {
  rrect,
  asymSlit,
  rpoly,
  uniteAll,
  subtractAll,
  subpathsToPaper,
  paperToSubpaths,
  translateSubpaths,
  bboxOfSubpaths,
  cleanupScope
} = require('./geometry');

/**
 * TYPOGRAPHY101 Complete Vietnamese Keyboard Glyph Set (135 glyphs)
 * Covers 100% of Windows Vietnamese / Telex / VNI / UniKey input:
 * - Đ (U+0110), đ (U+0111), ₫ (U+20AB)
 * - All 6 tones (ngang, huyền, sắc, hỏi, ngã, nặng) across all 12 Vietnamese vowels
 *   in BOTH Uppercase and Lowercase:
 *   A, Ă, Â, E, Ê, I, O, Ô, Ơ, U, Ư, Y / a, ă, â, e, ê, i, o, ô, ơ, u, ư, y
 *
 * Uses authentic Vietnamese typographic diacritic design:
 * - Side-nested acute/grave alongside circumflex (ấ ầ ế ề ố ồ) for compact display rhythm
 * - Sculptural attached horn on Ơ/ơ/Ư/ư
 * - Modular breve, hook-above (dấu hỏi), tilde (dấu ngã), and asymmetric pill dot-below (dấu nặng)
 */

function makeVN(char, name, buildFn) {
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
    source: 'designed-vietnamese'
  };
}

// ============================================================
// MODULAR VIETNAMESE DIACRITICS (faithful to i/j tittle DNA!)
// ============================================================
function markAcute(cx, baseY, scale = 1) {
  const s = scale;
  return rpoly([
    [cx - 16 * s, baseY, 8 * s],
    [cx + 16 * s, baseY, 5 * s],
    [cx + 52 * s, baseY + 56 * s, 12 * s],
    [cx + 4 * s, baseY + 56 * s, 8 * s]
  ]);
}

function markGrave(cx, baseY, scale = 1) {
  const s = scale;
  return rpoly([
    [cx - 52 * s, baseY + 56 * s, 12 * s],
    [cx - 4 * s, baseY + 56 * s, 8 * s],
    [cx + 16 * s, baseY, 8 * s],
    [cx - 16 * s, baseY, 5 * s]
  ]);
}

function markCircumflex(cx, baseY, w = 120, h = 56) {
  const hw = w / 2;
  const thick = 26;
  return rpoly([
    [cx - hw, baseY, 8],
    [cx, baseY + h, 12],
    [cx + hw, baseY, 8],
    [cx + hw - thick - 8, baseY, 4],
    [cx, baseY + h - thick, 6],
    [cx - hw + thick + 8, baseY, 4]
  ]);
}

function markBreve(cx, baseY, w = 116, h = 50) {
  const hw = w / 2;
  const outer = rrect(cx - hw, baseY, w, h, { tl: 10, tr: 10, br: 32, bl: 32 });
  const inner = rrect(cx - hw + 28, baseY + 22, w - 56, h, { br: 16, bl: 16 });
  return subtractAll(outer, [inner]);
}

function markHookAbove(cx, baseY, scale = 1) {
  // Crisp modular dấu hỏi (like miniature '?' hook without dot!)
  const s = scale;
  const w = 78 * s, h = 64 * s;
  const x0 = cx - w / 2;
  const outer = rrect(x0, baseY + 18 * s, w, h - 18 * s, { tl: 22 * s, tr: 22 * s, br: 18 * s, bl: 4 * s });
  const leftOpen = rrect(x0 - 6, baseY + 14 * s, 38 * s, 26 * s);
  const innerHole = rrect(x0 + 26 * s, baseY + 22 * s, 20 * s, 22 * s, { tl: 10 * s, tr: 3 * s });
  const stem = rrect(cx - 14 * s, baseY, 30 * s, 28 * s, { bl: 10 * s, br: 4 * s });
  return uniteAll([subtractAll(outer, [leftOpen, innerHole]), stem]);
}

function markTilde(cx, baseY, scale = 1) {
  const s = scale;
  return rpoly([
    [cx - 60 * s, baseY + 20 * s, 8 * s],
    [cx - 18 * s, baseY + 50 * s, 12 * s],
    [cx + 20 * s, baseY + 26 * s, 6 * s],
    [cx + 60 * s, baseY + 48 * s, 8 * s],
    [cx + 60 * s, baseY + 20 * s, 8 * s],
    [cx + 18 * s, baseY - 2 * s, 12 * s],
    [cx - 20 * s, baseY + 20 * s, 6 * s],
    [cx - 60 * s, baseY, 8 * s]
  ]);
}

function markDotBelow(cx, baseY = -58) {
  // Signature asymmetric pill dot matching period & i-tittle!
  return rrect(cx - 30, baseY, 60, 44, { tl: 5, tr: 18, br: 5, bl: 18 });
}

/**
 * Attached authentic upward-curling Vietnamese horn (dấu móc) for Ơ, ơ, Ư, ư!
 * Attaches seamlessly to the top-right shoulder of O/o/U/u and curls OUT and UPWARD
 * (classic geometric Vietnamese horn — never a downward beak!).
 */
function attachHorn(baseItem, baseBBox, isUpper) {
  const rightX = baseBBox.w;
  const topY = baseBBox.maxY;
  const hornW = isUpper ? 54 : 48;
  const hornH = isUpper ? 88 : 78;
  // Base of horn attaches smoothly to the upper-right wall of O/o/U/u and rises slightly above topY!
  const y0 = topY - (isUpper ? 66 : 58);
  // Upward-curling C-cup / J-hook facing up-left: rounded bottom-right outer curve (r=38), rounded top-right tip (r=18)!
  const outer = rrect(rightX - 28, y0, hornW + 28, hornH, { tl: 0, tr: 18, br: 42, bl: 0 });
  // Carve out the upper-left interior of the horn so it curls cleanly OUT and UP from the right wall!
  const inner = rrect(rightX - 16, y0 + 28, hornW - 14, hornH, { bl: 22, br: 14 });
  const hornHook = subtractAll(outer, [inner]);
  // Cleanly trim anything jutting left of rightX - 18 above the attachment point so top of O/U stays razor-clean
  const trimTopLeft = rrect(rightX - 36, y0 + 30, 36, hornH + 10);
  const cleanHorn = subtractAll(hornHook, [trimTopLeft]);
  return uniteAll([baseItem, cleanHorn]);
}

function addTone(baseItem, baseBBox, vowelMod, tone, isUpper, baseChar) {
  const cx = baseBBox.w / 2;
  // For horned letters (Ơ, ơ, Ư, ư), keep visual center over the main O/U body (not pulled right by the horn!)
  const bodyCenter = (vowelMod === 'horn') ? (isUpper ? 122 : 108) : cx;
  const topY = baseBBox.maxY;
  // Generous clean vertical breathing room above base glyph!
  const gap = isUpper ? 26 : 22;
  const parts = [baseItem];

  // Dot below (dấu nặng)
  if (tone === 'dotbelow') {
    if (vowelMod === 'circumflex') parts.push(markCircumflex(bodyCenter, topY + gap));
    else if (vowelMod === 'breve') parts.push(markBreve(bodyCenter, topY + gap));
    const dotY = (baseChar === 'y') ? -118 : -62;
    parts.push(markDotBelow(bodyCenter, dotY));
    return uniteAll(parts);
  }

  // Combined circumflex + tone (side-nested with generous crisp breathing separation!)
  if (vowelMod === 'circumflex') {
    const cfY = topY + gap;
    parts.push(markCircumflex(bodyCenter, cfY, 114, 50));
    if (tone === 'acute') {
      parts.push(markAcute(bodyCenter + 58, cfY + 42, 0.84));
    } else if (tone === 'grave') {
      parts.push(markGrave(bodyCenter - 58, cfY + 42, 0.84));
    } else if (tone === 'hook') {
      parts.push(markHookAbove(bodyCenter + 54, cfY + 44, 0.80));
    } else if (tone === 'tilde') {
      parts.push(markTilde(bodyCenter, cfY + 70, 0.82));
    }
    return uniteAll(parts);
  }

  // Combined breve + tone (clear generous vertical gap between breve bowl and tone mark!)
  if (vowelMod === 'breve') {
    const brY = topY + gap;
    parts.push(markBreve(bodyCenter, brY, 114, 44));
    if (tone === 'acute') {
      parts.push(markAcute(bodyCenter + 24, brY + 60, 0.80));
    } else if (tone === 'grave') {
      parts.push(markGrave(bodyCenter - 24, brY + 60, 0.80));
    } else if (tone === 'hook') {
      parts.push(markHookAbove(bodyCenter, brY + 60, 0.78));
    } else if (tone === 'tilde') {
      parts.push(markTilde(bodyCenter, brY + 68, 0.80));
    }
    return uniteAll(parts);
  }

  // Plain or horned vowel + single top tone
  // For horned vowels, topY includes the +22u horn tip, so position single tone nicely above main body cap/x-height!
  const toneBaseY = (vowelMod === 'horn') ? ((isUpper ? 324 : 216) + gap + 6) : (topY + gap);
  if (tone === 'acute') parts.push(markAcute(bodyCenter, toneBaseY));
  else if (tone === 'grave') parts.push(markGrave(bodyCenter, toneBaseY));
  else if (tone === 'hook') parts.push(markHookAbove(bodyCenter, toneBaseY));
  else if (tone === 'tilde') parts.push(markTilde(bodyCenter, toneBaseY));

  return uniteAll(parts);
}

function buildVietnameseGlyphs(origGlyphs, upperGlyphs) {
  const g = {};
  const allBase = { ...origGlyphs, ...upperGlyphs };

  // 1. Đ (U+0110) — Vietnamese uppercase D with stroke (matches Eth Ð cleanly)
  g['\u0110'] = makeVN('\u0110', 'Dcroat', () => {
    const dItem = subpathsToPaper(translateSubpaths(upperGlyphs.D.subpaths, 34, 0));
    const bar = rrect(0, 148, 124, 28, { tl: 6, tr: 12, br: 6, bl: 12 });
    return uniteAll([dItem, bar]);
  });

  // 2. đ (U+0111) — Vietnamese lowercase d with stroke (built directly on ORIGINAL d!)
  g['\u0111'] = makeVN('\u0111', 'dcroat', () => {
    const dItem = subpathsToPaper(origGlyphs.d.subpaths);
    // Original d ascender stem is on the right (x=123..216, y=216..327)
    // Clean horizontal stroke crossing the upper stem at y=254..280!
    const bar = rrect(92, 252, 152, 26, { tl: 6, tr: 12, br: 6, bl: 12 });
    return uniteAll([dItem, bar]);
  });

  // 3. ₫ (U+20AB) — Vietnamese Dong currency symbol (đ + crisp underline!)
  g['\u20AB'] = makeVN('\u20AB', 'dong', () => {
    const dItem = subpathsToPaper(origGlyphs.d.subpaths);
    const bar = rrect(92, 252, 152, 26, { tl: 6, tr: 12, br: 6, bl: 12 });
    const under = rrect(0, -48, 224, 26, { tl: 6, tr: 12, br: 6, bl: 12 });
    return uniteAll([dItem, bar, under]);
  });

  // 4. Base horned vowels: Ơ, ơ, Ư, ư
  const hornSpecs = [
    ['\u01A0', 'Ohorn', 'O', true],
    ['\u01A1', 'ohorn', 'o', false],
    ['\u01AF', 'Uhorn', 'U', true],
    ['\u01B0', 'uhorn', 'u', false],
  ];
  for (const [ch, name, baseCh, isUp] of hornSpecs) {
    const b = allBase[baseCh];
    g[ch] = makeVN(ch, name, () => attachHorn(subpathsToPaper(b.subpaths), b.bbox, isUp));
  }

  // 5. Base breve vowels: Ă, ă
  for (const [ch, name, baseCh, isUp] of [['\u0102', 'Abreve', 'A', true], ['\u0103', 'abreve', 'a', false]]) {
    const b = allBase[baseCh];
    g[ch] = makeVN(ch, name, () => addTone(subpathsToPaper(b.subpaths), b.bbox, 'breve', null, isUp, baseCh));
  }

  // 6. All remaining Vietnamese precomposed vowel+tone combinations!
  // (Skips chars already defined in special_letters? No — we overwrite/unify so Vietnamese tones stay 100% consistent!)
  const vnTable = [
    // A tones
    ['\u1EA2', 'Ahookabove', 'A', null, 'hook', true],
    ['\u1EA0', 'Adotbelow', 'A', null, 'dotbelow', true],
    ['\u1EA3', 'ahookabove', 'a', null, 'hook', false],
    ['\u1EA1', 'adotbelow', 'a', null, 'dotbelow', false],

    // Â + tones
    ['\u1EA6', 'Acircumflexgrave', 'A', 'circumflex', 'grave', true],
    ['\u1EA4', 'Acircumflexacute', 'A', 'circumflex', 'acute', true],
    ['\u1EA8', 'Acircumflexhookabove', 'A', 'circumflex', 'hook', true],
    ['\u1EAA', 'Acircumflextilde', 'A', 'circumflex', 'tilde', true],
    ['\u1EAC', 'Acircumflexdotbelow', 'A', 'circumflex', 'dotbelow', true],
    ['\u1EA7', 'acircumflexgrave', 'a', 'circumflex', 'grave', false],
    ['\u1EA5', 'acircumflexacute', 'a', 'circumflex', 'acute', false],
    ['\u1EA9', 'acircumflexhookabove', 'a', 'circumflex', 'hook', false],
    ['\u1EAB', 'acircumflextilde', 'a', 'circumflex', 'tilde', false],
    ['\u1EAD', 'acircumflexdotbelow', 'a', 'circumflex', 'dotbelow', false],

    // Ă + tones
    ['\u1EB0', 'Abrevegrave', 'A', 'breve', 'grave', true],
    ['\u1EAE', 'Abreveacute', 'A', 'breve', 'acute', true],
    ['\u1EB2', 'Abrevehookabove', 'A', 'breve', 'hook', true],
    ['\u1EB4', 'Abrevetilde', 'A', 'breve', 'tilde', true],
    ['\u1EB6', 'Abrevedotbelow', 'A', 'breve', 'dotbelow', true],
    ['\u1EB1', 'abrevegrave', 'a', 'breve', 'grave', false],
    ['\u1EAF', 'abreveacute', 'a', 'breve', 'acute', false],
    ['\u1EB3', 'abrevehookabove', 'a', 'breve', 'hook', false],
    ['\u1EB5', 'abrevetilde', 'a', 'breve', 'tilde', false],
    ['\u1EB7', 'abrevedotbelow', 'a', 'breve', 'dotbelow', false],

    // E tones
    ['\u1EBA', 'Ehookabove', 'E', null, 'hook', true],
    ['\u1EBC', 'Etilde', 'E', null, 'tilde', true],
    ['\u1EB8', 'Edotbelow', 'E', null, 'dotbelow', true],
    ['\u1EBB', 'ehookabove', 'e', null, 'hook', false],
    ['\u1EBD', 'etilde', 'e', null, 'tilde', false],
    ['\u1EB9', 'edotbelow', 'e', null, 'dotbelow', false],

    // Ê + tones
    ['\u1EC0', 'Ecircumflexgrave', 'E', 'circumflex', 'grave', true],
    ['\u1EBE', 'Ecircumflexacute', 'E', 'circumflex', 'acute', true],
    ['\u1EC2', 'Ecircumflexhookabove', 'E', 'circumflex', 'hook', true],
    ['\u1EC4', 'Ecircumflextilde', 'E', 'circumflex', 'tilde', true],
    ['\u1EC6', 'Ecircumflexdotbelow', 'E', 'circumflex', 'dotbelow', true],
    ['\u1EC1', 'ecircumflexgrave', 'e', 'circumflex', 'grave', false],
    ['\u1EBF', 'ecircumflexacute', 'e', 'circumflex', 'acute', false],
    ['\u1EC3', 'ecircumflexhookabove', 'e', 'circumflex', 'hook', false],
    ['\u1EC5', 'ecircumflextilde', 'e', 'circumflex', 'tilde', false],
    ['\u1EC7', 'ecircumflexdotbelow', 'e', 'circumflex', 'dotbelow', false],

    // I tones (dotless i for upper tones, regular dotted i for dotbelow ị!)
    ['\u1EC8', 'Ihookabove', 'I', null, 'hook', true],
    ['\u0128', 'Itilde', 'I', null, 'tilde', true],
    ['\u1ECA', 'Idotbelow', 'I', null, 'dotbelow', true],
    ['\u1EC9', 'ihookabove', '\u0131', null, 'hook', false],
    ['\u0129', 'itilde', '\u0131', null, 'tilde', false],
    ['\u1ECB', 'idotbelow', 'i', null, 'dotbelow', false],

    // O tones
    ['\u1ECE', 'Ohookabove', 'O', null, 'hook', true],
    ['\u1ECC', 'Odotbelow', 'O', null, 'dotbelow', true],
    ['\u1ECF', 'ohookabove', 'o', null, 'hook', false],
    ['\u1ECD', 'odotbelow', 'o', null, 'dotbelow', false],

    // Ô + tones
    ['\u1ED2', 'Ocircumflexgrave', 'O', 'circumflex', 'grave', true],
    ['\u1ED0', 'Ocircumflexacute', 'O', 'circumflex', 'acute', true],
    ['\u1ED4', 'Ocircumflexhookabove', 'O', 'circumflex', 'hook', true],
    ['\u1ED6', 'Ocircumflextilde', 'O', 'circumflex', 'tilde', true],
    ['\u1ED8', 'Ocircumflexdotbelow', 'O', 'circumflex', 'dotbelow', true],
    ['\u1ED3', 'ocircumflexgrave', 'o', 'circumflex', 'grave', false],
    ['\u1ED1', 'ocircumflexacute', 'o', 'circumflex', 'acute', false],
    ['\u1ED5', 'ocircumflexhookabove', 'o', 'circumflex', 'hook', false],
    ['\u1ED7', 'ocircumflextilde', 'o', 'circumflex', 'tilde', false],
    ['\u1ED9', 'ocircumflexdotbelow', 'o', 'circumflex', 'dotbelow', false],

    // Ơ + tones
    ['\u1EDC', 'Ohorngrave', '\u01A0', 'horn', 'grave', true],
    ['\u1EDA', 'Ohornacute', '\u01A0', 'horn', 'acute', true],
    ['\u1EDE', 'Ohornhookabove', '\u01A0', 'horn', 'hook', true],
    ['\u1EE0', 'Ohorntilde', '\u01A0', 'horn', 'tilde', true],
    ['\u1EE2', 'Ohorndotbelow', '\u01A0', 'horn', 'dotbelow', true],
    ['\u1EDD', 'ohorngrave', '\u01A1', 'horn', 'grave', false],
    ['\u1EDB', 'ohornacute', '\u01A1', 'horn', 'acute', false],
    ['\u1EDF', 'ohornhookabove', '\u01A1', 'horn', 'hook', false],
    ['\u1EE1', 'ohorntilde', '\u01A1', 'horn', 'tilde', false],
    ['\u1EE3', 'ohorndotbelow', '\u01A1', 'horn', 'dotbelow', false],

    // U tones
    ['\u1EE6', 'Uhookabove', 'U', null, 'hook', true],
    ['\u0168', 'Utilde', 'U', null, 'tilde', true],
    ['\u1EE4', 'Udotbelow', 'U', null, 'dotbelow', true],
    ['\u1EE7', 'uhookabove', 'u', null, 'hook', false],
    ['\u0169', 'utilde', 'u', null, 'tilde', false],
    ['\u1EE5', 'udotbelow', 'u', null, 'dotbelow', false],

    // Ư + tones
    ['\u1EEA', 'Uhorngrave', '\u01AF', 'horn', 'grave', true],
    ['\u1EE8', 'Uhornacute', '\u01AF', 'horn', 'acute', true],
    ['\u1EEC', 'Uhornhookabove', '\u01AF', 'horn', 'hook', true],
    ['\u1EEE', 'Uhorntilde', '\u01AF', 'horn', 'tilde', true],
    ['\u1EF0', 'Uhorndotbelow', '\u01AF', 'horn', 'dotbelow', true],
    ['\u1EEB', 'uhorngrave', '\u01B0', 'horn', 'grave', false],
    ['\u1EE9', 'uhornacute', '\u01B0', 'horn', 'acute', false],
    ['\u1EED', 'uhornhookabove', '\u01B0', 'horn', 'hook', false],
    ['\u1EEF', 'uhorntilde', '\u01B0', 'horn', 'tilde', false],
    ['\u1EF1', 'uhorndotbelow', '\u01B0', 'horn', 'dotbelow', false],

    // Y tones
    ['\u1EF2', 'Ygrave', 'Y', null, 'grave', true],
    ['\u1EF6', 'Yhookabove', 'Y', null, 'hook', true],
    ['\u1EF8', 'Ytilde', 'Y', null, 'tilde', true],
    ['\u1EF4', 'Ydotbelow', 'Y', null, 'dotbelow', true],
    ['\u1EF3', 'ygrave', 'y', null, 'grave', false],
    ['\u1EF7', 'yhookabove', 'y', null, 'hook', false],
    ['\u1EF9', 'ytilde', 'y', null, 'tilde', false],
    ['\u1EF5', 'ydotbelow', 'y', null, 'dotbelow', false],
  ];

  for (const [ch, name, baseCh, vowelMod, tone, isUp] of vnTable) {
    const b = g[baseCh] || allBase[baseCh];
    if (!b) continue;
    g[ch] = makeVN(ch, name, () => addTone(subpathsToPaper(b.subpaths), b.bbox, vowelMod, tone, isUp, baseCh));
  }

  return g;
}

module.exports = { buildVietnameseGlyphs };
