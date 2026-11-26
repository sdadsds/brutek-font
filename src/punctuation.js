const {
  rrect,
  asymSlit,
  rpoly,
  circle,
  uniteAll,
  subtractAll,
  paperToSubpaths,
  bboxOfSubpaths,
  translateSubpaths,
  cleanupScope
} = require('./geometry');

const { CAP_H, STEM, BAR } = require('./uppercase');

/**
 * TYPOGRAPHY101 Punctuation, Math, Currency & Special Symbols
 * Every dot/period/quote inherits the iconic asymmetric pill DNA of the i/j tittle (tr & bl rounded, tl & br tight/sharp)!
 * Every stem uses the heavy vertical weight (68-94) and crisp thin horizontal bar (24-30)!
 */

function makeSym(char, name, buildFn) {
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
    source: 'designed-punctuation'
  };
}

// Signature asymmetric dot/pill (echoing the i/j tittle!)
function asymDot(x, y, w = 74, h = 64) {
  return rrect(x, y, w, h, { tl: 6, tr: 24, br: 6, bl: 24 });
}

function buildPunctuationGlyphs() {
  const g = {};

  // Period .
  g['.'] = makeSym('.', 'period', () => asymDot(0, 0, 74, 62));

  // Comma , (asymmetric dot + sweeping descender tail!)
  g[','] = makeSym(',', 'comma', () => {
    const dot = asymDot(16, 0, 74, 62);
    const tail = rpoly([
      [48, 22, 0],
      [90, 22, 0],
      [56, -64, 16],
      [0, -64, 14],
      [34, 4, 8]
    ]);
    return uniteAll([dot, tail]);
  });

  // Colon :
  g[':'] = makeSym(':', 'colon', () => uniteAll([
    asymDot(0, 0, 74, 62),
    asymDot(0, 154, 74, 62)
  ]));

  // Semicolon ;
  g[';'] = makeSym(';', 'semicolon', () => {
    const topDot = asymDot(16, 154, 74, 62);
    const botDot = asymDot(16, 0, 74, 62);
    const tail = rpoly([
      [48, 22, 0],
      [90, 22, 0],
      [56, -64, 16],
      [0, -64, 14],
      [34, 4, 8]
    ]);
    return uniteAll([topDot, botDot, tail]);
  });

  // Exclamation !
  g['!'] = makeSym('!', 'exclam', () => {
    const stem = rrect(0, 86, 88, CAP_H - 86, { tl: 0, tr: 24, br: 4, bl: 24 });
    const dot = asymDot(7, 0, 74, 62);
    return uniteAll([stem, dot]);
  });

  // Inverted exclamation ¡
  g['\u00A1'] = makeSym('\u00A1', 'exclamdown', () => {
    const dot = asymDot(7, 198, 74, 62);
    const stem = rrect(0, -64, 88, 238, { tl: 0, tr: 24, br: 4, bl: 24 });
    return uniteAll([stem, dot]);
  });

  // Question ? (clean arch flowing smoothly into centered drop stem over dot — zero jogs!)
  g['?'] = makeSym('?', 'question', () => {
    const w = 228;
    const archOuter = rrect(0, 148, w, CAP_H - 148, { tl: 34, tr: 34, br: 32, bl: 0 });
    const leftOpen = rrect(-10, 140, 128, 118);
    const slit = rrect(84, 174, 40, (CAP_H - BAR) - 174, { tl: 26, tr: 5 });
    const leftArmFillet = subtractAll(
      rrect(84 - 14, 258, 14, 14),
      [rrect(84 - 28, 258, 28, 28, { br: 14 })]
    );
    const arch = subtractAll(archOuter, [uniteAll([leftOpen, slit, leftArmFillet])]);
    // Centered drop stem (x=76..160) transitioning cleanly from arch bottom down to y=84
    const stem = rrect(76, 84, 84, 96, { tl: 20, tr: 0, br: 6, bl: 22 });
    const rightTrim = rrect(160, 70, 80, 78);
    const head = subtractAll(uniteAll([arch, stem]), [rightTrim]);
    const dot = asymDot(81, 0, 74, 62);
    return uniteAll([head, dot]);
  });

  // Inverted question ¿ (exact optical 180-degree sibling of ?)
  g['\u00BF'] = makeSym('\u00BF', 'questiondown', () => {
    const w = 228;
    // Build exact ? then rotate 180 degrees around center so it's 100% symmetrical with zero artifacts!
    const archOuter = rrect(0, 148, w, CAP_H - 148, { tl: 34, tr: 34, br: 32, bl: 0 });
    const leftOpen = rrect(-10, 140, 128, 118);
    const slit = rrect(84, 174, 40, (CAP_H - BAR) - 174, { tl: 26, tr: 5 });
    const leftArmFillet = subtractAll(
      rrect(84 - 14, 258, 14, 14),
      [rrect(84 - 28, 258, 28, 28, { br: 14 })]
    );
    const arch = subtractAll(archOuter, [uniteAll([leftOpen, slit, leftArmFillet])]);
    const stem = rrect(76, 84, 84, 96, { tl: 20, tr: 0, br: 6, bl: 22 });
    const rightTrim = rrect(160, 70, 80, 78);
    const head = subtractAll(uniteAll([arch, stem]), [rightTrim]);
    const dot = asymDot(81, 0, 74, 62);
    const qMark = uniteAll([head, dot]);
    // Rotate 180 degrees and shift into descender/x-height range (-64 .. 260)
    qMark.rotate(180);
    qMark.translate({ x: 0, y: 64 }); // in Paper Y-down, +64 moves down by 64u in Y-up!
    return qMark;
  });

  // Hyphen -
  g['-'] = makeSym('-', 'hyphen', () => rrect(0, 102, 128, 38, { tl: 6, tr: 18, br: 6, bl: 18 }));

  // En-dash –
  g['\u2013'] = makeSym('\u2013', 'endash', () => rrect(0, 102, 184, 34, { tl: 6, tr: 16, br: 6, bl: 16 }));

  // Em-dash —
  g['\u2014'] = makeSym('\u2014', 'emdash', () => rrect(0, 102, 260, 34, { tl: 6, tr: 16, br: 6, bl: 16 }));

  // Underscore _
  g['_'] = makeSym('_', 'underscore', () => rrect(0, -56, 224, 32, { tl: 6, tr: 14, br: 6, bl: 14 }));

  // Single straight quote '
  g["'"] = makeSym("'", 'quotesingle', () => rrect(0, 226, 62, 98, { tl: 4, tr: 20, br: 4, bl: 20 }));

  // Double straight quote "
  g['"'] = makeSym('"', 'quotedbl', () => uniteAll([
    rrect(0, 226, 62, 98, { tl: 4, tr: 20, br: 4, bl: 20 }),
    rrect(84, 226, 62, 98, { tl: 4, tr: 20, br: 4, bl: 20 })
  ]));

  // Curly single quotes ‘ ’
  g['\u2018'] = makeSym('\u2018', 'quoteleft', () => {
    const dot = asymDot(0, 226, 64, 54);
    const tail = rpoly([[0, 260, 0], [36, 260, 0], [64, 324, 14], [18, 324, 12]]);
    return uniteAll([dot, tail]);
  });
  g['\u2019'] = makeSym('\u2019', 'quoteright', () => {
    const dot = asymDot(14, 270, 64, 54);
    const tail = rpoly([[42, 290, 0], [78, 290, 0], [50, 220, 14], [4, 220, 12]]);
    return uniteAll([dot, tail]);
  });

  // Curly double quotes “ ”
  g['\u201C'] = makeSym('\u201C', 'quotedblleft', () => {
    const q1 = uniteAll([asymDot(0, 226, 58, 52), rpoly([[0, 258, 0], [34, 258, 0], [58, 324, 12], [16, 324, 12]])]);
    const q2 = uniteAll([asymDot(78, 226, 58, 52), rpoly([[78, 258, 0], [112, 258, 0], [136, 324, 12], [94, 324, 12]])]);
    return uniteAll([q1, q2]);
  });
  g['\u201D'] = makeSym('\u201D', 'quotedblright', () => {
    const q1 = uniteAll([asymDot(12, 272, 58, 52), rpoly([[38, 290, 0], [70, 290, 0], [44, 220, 12], [2, 220, 12]])]);
    const q2 = uniteAll([asymDot(90, 272, 58, 52), rpoly([[116, 290, 0], [148, 290, 0], [122, 220, 12], [80, 220, 12]])]);
    return uniteAll([q1, q2]);
  });

  // Parentheses ( )
  g['('] = makeSym('(', 'parenleft', () => {
    const outer = rrect(0, -64, 134, 396, { tl: 76, bl: 76, tr: 16, br: 16 });
    const inner = rrect(78, -34, 80, 336, { tl: 44, bl: 44 });
    return subtractAll(outer, [inner]);
  });
  g[')'] = makeSym(')', 'parenright', () => {
    const outer = rrect(0, -64, 134, 396, { tr: 76, br: 76, tl: 16, bl: 16 });
    const inner = rrect(-24, -34, 80, 336, { tr: 44, br: 44 });
    return subtractAll(outer, [inner]);
  });

  // Square brackets [ ]
  g['['] = makeSym('[', 'bracketleft', () => {
    const outer = rrect(0, -64, 136, 396, { tl: 18, bl: 18, tr: 12, br: 12 });
    const cut = rrect(76, -34, 80, 336, { tl: 10, bl: 10 });
    return subtractAll(outer, [cut]);
  });
  g[']'] = makeSym(']', 'bracketright', () => {
    const outer = rrect(0, -64, 136, 396, { tr: 18, br: 18, tl: 12, bl: 12 });
    const cut = rrect(-20, -34, 80, 336, { tr: 10, br: 10 });
    return subtractAll(outer, [cut]);
  });

  // Curly braces { }
  g['{'] = makeSym('{', 'braceleft', () => {
    const top = rrect(28, 132, 118, 200, { tl: 40, tr: 12 });
    const bot = rrect(28, -64, 118, 200, { bl: 40, br: 12 });
    const tip = rpoly([[0, 134, 10], [44, 168, 0], [44, 100, 0]]);
    const outer = uniteAll([top, bot, tip]);
    const cutT = rrect(94, 148, 70, 156, { tl: 18, bl: 14 });
    const cutB = rrect(94, -36, 70, 156, { bl: 18, tl: 14 });
    return subtractAll(outer, [cutT, cutB]);
  });
  g['}'] = makeSym('}', 'braceright', () => {
    const top = rrect(0, 132, 118, 200, { tr: 40, tl: 12 });
    const bot = rrect(0, -64, 118, 200, { br: 40, bl: 12 });
    const tip = rpoly([[146, 134, 10], [102, 168, 0], [102, 100, 0]]);
    const outer = uniteAll([top, bot, tip]);
    const cutT = rrect(-18, 148, 70, 156, { tr: 18, br: 14 });
    const cutB = rrect(-18, -36, 70, 156, { br: 18, tr: 14 });
    return subtractAll(outer, [cutT, cutB]);
  });

  // Slash / & Backslash \ & Pipe |
  g['/'] = makeSym('/', 'slash', () => rpoly([
    [102, CAP_H + 8, 14],
    [186, CAP_H + 8, 4],
    [84, -64, 14],
    [0, -64, 4]
  ]));
  g['\\'] = makeSym('\\', 'backslash', () => rpoly([
    [0, CAP_H + 8, 4],
    [84, CAP_H + 8, 14],
    [186, -64, 4],
    [102, -64, 14]
  ]));
  g['|'] = makeSym('|', 'bar', () => rrect(0, -64, 68, 396, { tl: 4, tr: 20, br: 4, bl: 20 }));

  // Math: + = < > × ÷
  g['+'] = makeSym('+', 'plus', () => uniteAll([
    rrect(0, 128, 212, 34, { tl: 8, tr: 14, br: 8, bl: 14 }),
    rrect(68, 42, 76, 206, { tl: 4, tr: 20, br: 4, bl: 20 })
  ]));
  g['='] = makeSym('=', 'equal', () => uniteAll([
    rrect(0, 174, 212, 34, { tl: 6, tr: 16, br: 6, bl: 16 }),
    rrect(0, 88, 212, 34, { tl: 6, tr: 16, br: 6, bl: 16 })
  ]));
  g['<'] = makeSym('<', 'less', () => {
    const outer = rpoly([[0, 148, 14], [192, 266, 16], [192, 30, 16]]);
    const inner = rpoly([[94, 148, 8], [210, 218, 0], [210, 78, 0]]);
    return subtractAll(outer, [inner]);
  });
  g['>'] = makeSym('>', 'greater', () => {
    const outer = rpoly([[192, 148, 14], [0, 266, 16], [0, 30, 16]]);
    const inner = rpoly([[98, 148, 8], [-18, 218, 0], [-18, 78, 0]]);
    return subtractAll(outer, [inner]);
  });
  g['\u00D7'] = makeSym('\u00D7', 'multiply', () => {
    const a = rpoly([[0, 224, 10], [64, 224, 10], [186, 68, 10], [122, 68, 10]]);
    const b = rpoly([[122, 224, 10], [186, 224, 10], [64, 68, 10], [0, 68, 10]]);
    return uniteAll([a, b]);
  });
  g['\u00F7'] = makeSym('\u00F7', 'divide', () => uniteAll([
    rrect(0, 128, 212, 34, { tl: 6, tr: 16, br: 6, bl: 16 }),
    asymDot(72, 196, 68, 56),
    asymDot(72, 38, 68, 56)
  ]));

  // Asterisk *
  g['*'] = makeSym('*', 'asterisk', () => {
    const cx = 86, cy = 248;
    const arm1 = rrect(cx - 26, cy - 76, 52, 152, { tl: 10, tr: 16, br: 10, bl: 16 });
    const arm2 = rpoly([
      [cx - 72, cy + 44, 12], [cx - 46, cy + 68, 12],
      [cx + 72, cy - 44, 12], [cx + 46, cy - 68, 12]
    ]);
    const arm3 = rpoly([
      [cx + 46, cy + 68, 12], [cx + 72, cy + 44, 12],
      [cx - 46, cy - 68, 12], [cx - 72, cy - 44, 12]
    ]);
    return uniteAll([arm1, arm2, arm3]);
  });

  // Hash # (heavy slanted/upright verticals + thin horizontals!)
  g['#'] = makeSym('#', 'numbersign', () => {
    const v1 = rpoly([[46, 0, 12], [116, 0, 4], [140, CAP_H, 12], [70, CAP_H, 4]]);
    const v2 = rpoly([[154, 0, 12], [224, 0, 4], [248, CAP_H, 12], [178, CAP_H, 4]]);
    const h1 = rrect(8, 206, 264, 30, { tl: 6, tr: 14, br: 6, bl: 14 });
    const h2 = rrect(0, 90, 264, 30, { tl: 6, tr: 14, br: 6, bl: 14 });
    return uniteAll([v1, v2, h1, h2]);
  });

  // Dollar $ (S + vertical bars sticking cleanly above & below!)
  g['$'] = makeSym('$', 'dollar', () => {
    const w = 236;
    const outer = rrect(0, 0, w, CAP_H, { tl: 26, tr: 26, br: 26, bl: 26 });
    const midY = 162, midHalf = 14, cutH = 44;
    const tGapY0 = midY + midHalf, tGapY1 = tGapY0 + cutH;
    const bGapY1 = midY - midHalf, bGapY0 = bGapY1 - cutH;
    const tSlit = rrect(98, tGapY0, 40, (CAP_H - BAR) - tGapY0, { tl: 26, tr: 5, bl: 14 });
    const tGap = rrect(98, tGapY0, w - 98 + 10, cutH, { tl: 14, bl: 14 });
    const bSlit = rrect(98, BAR, 40, bGapY1 - BAR, { br: 26, bl: 5, tr: 14 });
    const bGap = rrect(-10, bGapY0, 148, cutH, { tr: 14, br: 14 });
    const sBody = subtractAll(outer, [uniteAll([tSlit, tGap]), uniteAll([bSlit, bGap])]);
    const topPin = rrect(92, CAP_H - 12, 52, 54, { tl: 4, tr: 18 });
    const botPin = rrect(92, -42, 52, 54, { bl: 18, br: 4 });
    return uniteAll([sBody, topPin, botPin]);
  });

  // Percent % (heavy diagonal slash + twin mini asymmetric-slit circles!)
  g['%'] = makeSym('%', 'percent', () => {
    const slash = rpoly([[184, CAP_H, 10], [250, CAP_H, 4], [108, 0, 10], [42, 0, 4]]);
    const c1 = subtractAll(
      rrect(0, 178, 128, 146, { tl: 24, tr: 24, br: 24, bl: 24 }),
      [asymSlit(46, 200, 36, 102, 18, 4)]
    );
    const c2 = subtractAll(
      rrect(164, 0, 128, 146, { tl: 24, tr: 24, br: 24, bl: 24 }),
      [asymSlit(210, 22, 36, 102, 18, 4)]
    );
    return uniteAll([slash, c1, c2]);
  });

  // Ampersand & (unmistakable grotesque modular ampersand!
  // Distinct narrower top loop + open upper-right bay + crossing right arm + sweeping diagonal leg + bottom-right crotch!)
  g['&'] = makeSym('&', 'ampersand', () => {
    const w = 278;
    // 1. Compact upper loop shifted slightly left (x=22..204, y=166..324) — leaves wide open white space on upper-right!
    const topLoop = rrect(22, 162, 180, CAP_H - 162, { tl: 40, tr: 40, br: 24, bl: 24 });
    // 2. Fuller lower bowl (x=0..216, y=0..180)
    const botBowl = rrect(0, 0, 212, 180, { tl: 36, tr: 20, br: 38, bl: 38 });
    // Smooth bridge uniting upper loop & lower bowl on the left without sharp step
    const leftBridge = rpoly([
      [22, 212, 0], [180, 212, 0], [180, 130, 0], [0, 130, 0], [0, 166, 28], [22, 186, 20]
    ]);
    // 3. Bold diagonal crossing leg sweeping from center waist down to bottom-right (x=w, y=0)
    const crossLeg = rpoly([
      [118, 182, 0],
      [176, 182, 0],
      [w, 0, 0],
      [w - 82, 0, 14]
    ]);
    // 4. Sculptural right crossing arm jutting cleanly out at mid-height (y=114..160, x=156..w-4)
    // Creates the unmistakable classic '&' crossing silhouette (open bay above + open V-notch below!)
    const rightArm = rrect(156, 118, w - 160, 42, { tl: 10, tr: 22, br: 12, bl: 10 });
    const body = uniteAll([topLoop, botBowl, leftBridge, crossLeg, rightArm]);

    // 5. Twin signature asymmetric counter slits inside upper loop & lower bowl!
    const topHole = asymSlit(92, 190, 36, CAP_H - 218, 22, 4);
    const botHole = asymSlit(84, 28, 38, 122, 24, 5);
    // 6. Clean open bottom-right crotch notch separating lower bowl's curve from the crossing leg's foot!
    const botCrotch = rpoly([
      [178, -6, 0],
      [216, -6, 0],
      [196, 52, 12]
    ]);
    // 7. Clean open notch on upper-right between upper loop and crossing arm!
    const upperRightCrotch = rpoly([
      [198, 160, 12],
      [286, 160, 0],
      [286, 240, 0],
      [202, 240, 0]
    ]);
    return subtractAll(body, [topHole, botHole, botCrotch, upperRightCrotch]);
  });

  // At sign @ (bold modular outer ring with thin top/bottom bars + mini a-core!)
  g['@'] = makeSym('@', 'at', () => {
    const w = 296;
    const outer = rrect(0, 0, w, CAP_H, { tl: 44, tr: 44, br: 44, bl: 44 });
    const innerVoid = rrect(58, 30, w - 116, CAP_H - 60, { tl: 28, tr: 28, br: 24, bl: 28 });
    const openGap = rrect(170, 0, 136, 56);
    const ring = subtractAll(outer, [innerVoid, openGap]);
    // Mini modular 'a' / 'o' core inside
    const coreOuter = rrect(82, 74, 134, 176, { tl: 22, tr: 22, br: 10, bl: 22 });
    const coreHole = asymSlit(132, 98, 32, 128, 18, 4);
    const core = subtractAll(coreOuter, [coreHole]);
    const connector = rrect(192, 74, 96, 36, { br: 18 });
    return uniteAll([ring, core, connector]);
  });

  // Euro €
  g['\u20AC'] = makeSym('\u20AC', 'Euro', () => {
    const cOuter = rrect(26, 0, 232, CAP_H, { tl: 32, tr: 26, br: 26, bl: 32 });
    const openY0 = 114, openY1 = 210;
    const cTop = rrect(124, openY1 - 12, 40, CAP_H - BAR - (openY1 - 12), { tl: 26, tr: 5 });
    const cBot = rrect(124, BAR, 40, (openY0 + 12) - BAR, { br: 26, bl: 5 });
    const cMid = rrect(124, openY0, 144, openY1 - openY0);
    const cBody = subtractAll(cOuter, [uniteAll([cTop, cBot, cMid])]);
    const bar1 = rrect(0, 176, 178, 26, { tl: 6, tr: 12, br: 6, bl: 12 });
    const bar2 = rrect(0, 122, 162, 26, { tl: 6, tr: 12, br: 6, bl: 12 });
    return uniteAll([cBody, bar1, bar2]);
  });

  // Pound £
  g['\u00A3'] = makeSym('\u00A3', 'sterling', () => {
    const w = 236;
    const topArch = rrect(22, 0, w - 22, CAP_H, { tl: 36, tr: 32, br: 24, bl: 0 });
    const rightCut = rrect(122, 42, 130, 190, { tl: 16 });
    const topSlit = rrect(122, 210, 40, CAP_H - BAR - 210, { tl: 26, tr: 5 });
    const body = subtractAll(topArch, [uniteAll([rightCut, topSlit])]);
    const cross = rrect(0, 142, 186, 28, { tl: 6, tr: 14, br: 6, bl: 14 });
    const base = rrect(0, 0, w, 40, { tl: 8, tr: 18, br: 22, bl: 0 });
    return uniteAll([body, cross, base]);
  });

  // Yen ¥
  g['\u00A5'] = makeSym('\u00A5', 'yen', () => {
    const w = 252;
    const forkY = 128;
    const upper = rpoly([
      [0, CAP_H, 0], [w, CAP_H, 24], [w, 200, 14],
      [(w + STEM) / 2, forkY, 12], [(w - STEM) / 2, forkY, 12], [0, 200, 14]
    ]);
    const stem = rrect((w - STEM) / 2, 0, STEM, forkY + 30, { bl: 24 });
    const slit = rrect(106, forkY + 26, 40, CAP_H - (forkY + 26) + 10, { br: 26, bl: 5 });
    const yBody = subtractAll(uniteAll([upper, stem]), [slit]);
    const b1 = rrect(16, 118, w - 32, 26, { tl: 6, tr: 12, br: 6, bl: 12 });
    const b2 = rrect(16, 66, w - 32, 26, { tl: 6, tr: 12, br: 6, bl: 12 });
    return uniteAll([yBody, b1, b2]);
  });

  // Cent ¢
  g['\u00A2'] = makeSym('\u00A2', 'cent', () => {
    const outer = rrect(0, 26, 216, 216, { tl: 24, tr: 24, br: 24, bl: 24 });
    const cTop = rrect(93, 152, 30, 66, { tl: 22, tr: 4 });
    const cBot = rrect(93, 50, 30, 66, { br: 22, bl: 4 });
    const cMid = rrect(93, 110, 130, 48);
    const cBody = subtractAll(outer, [uniteAll([cTop, cBot, cMid])]);
    const pinT = rrect(88, 224, 40, 62, { tl: 4, tr: 14 });
    const pinB = rrect(88, -18, 40, 62, { bl: 14, br: 4 });
    return uniteAll([cBody, pinT, pinB]);
  });

  // Caret ^, Tilde ~, Grave `
  g['^'] = makeSym('^', 'asciicircum', () => {
    const outer = rpoly([[0, 202, 12], [94, 324, 14], [188, 202, 12], [134, 202, 8], [94, 266, 8], [54, 202, 8]]);
    return outer;
  });
  g['~'] = makeSym('~', 'asciitilde', () => rpoly([
    [0, 138, 12], [68, 186, 18], [132, 148, 10], [192, 182, 12],
    [192, 140, 12], [126, 98, 18], [62, 136, 10], [0, 102, 12]
  ]));
  g['`'] = makeSym('`', 'grave', () => rpoly([
    [0, 324, 14], [58, 324, 8], [104, 256, 12], [58, 256, 10]
  ]));

  // Degree °
  g['\u00B0'] = makeSym('\u00B0', 'degree', () => subtractAll(
    rrect(0, 204, 114, 120, { tl: 26, tr: 26, br: 26, bl: 26 }),
    [asymSlit(42, 226, 30, 76, 16, 4)]
  ));

  // Middle dot · & Bullet • & Ellipsis …
  g['\u00B7'] = makeSym('\u00B7', 'periodcentered', () => asymDot(0, 96, 66, 56));
  g['\u2022'] = makeSym('\u2022', 'bullet', () => asymDot(0, 74, 110, 104));
  g['\u2026'] = makeSym('\u2026', 'ellipsis', () => uniteAll([
    asymDot(0, 0, 68, 58),
    asymDot(92, 0, 68, 58),
    asymDot(184, 0, 68, 58)
  ]));

  // Section § (clean symmetrical stacked double-S with centered oval loop!)
  g['\u00A7'] = makeSym('\u00A7', 'section', () => {
    const w = 216;
    const outer = rrect(0, -40, w, 364, { tl: 30, tr: 30, br: 30, bl: 30 });
    const tSlit = rrect(93, 218, 30, 82, { tl: 20, tr: 4, bl: 12 });
    const tGap = rrect(93, 218, 134, 42, { tl: 12, bl: 12 });
    const midHole = asymSlit(93, 100, 30, 86, 18, 4);
    const bSlit = rrect(93, -16, 30, 84, { br: 20, bl: 4, tr: 12 });
    const bGap = rrect(-10, 26, 134, 42, { tr: 12, br: 12 });
    return subtractAll(outer, [uniteAll([tSlit, tGap]), midHole, uniteAll([bSlit, bGap])]);
  });

  // Copyright ©
  g['\u00A9'] = makeSym('\u00A9', 'copyright', () => {
    const w = 276;
    const outer = rrect(0, 24, w, 276, { tl: 52, tr: 52, br: 52, bl: 52 });
    const inner = rrect(30, 54, w - 60, 216, { tl: 34, tr: 34, br: 34, bl: 34 });
    const ring = subtractAll(outer, [inner]);
    const cOuter = rrect(76, 86, 124, 152, { tl: 20, tr: 20, br: 20, bl: 20 });
    const cSlit = asymSlit(124, 108, 28, 108, 16, 4);
    const cOpen = rrect(134, 136, 80, 52);
    return uniteAll([ring, subtractAll(cOuter, [uniteAll([cSlit, cOpen])])]);
  });

  // Registered ®
  g['\u00AE'] = makeSym('\u00AE', 'registered', () => {
    const w = 276;
    const outer = rrect(0, 24, w, 276, { tl: 52, tr: 52, br: 52, bl: 52 });
    const inner = rrect(30, 54, w - 60, 216, { tl: 34, tr: 34, br: 34, bl: 34 });
    const ring = subtractAll(outer, [inner]);
    const rStem = rrect(80, 88, 48, 148, { bl: 10 });
    const rBowl = rrect(80, 148, 118, 88, { tr: 18, br: 16 });
    const rLeg = rpoly([[130, 156, 0], [166, 156, 0], [202, 88, 0], [156, 88, 8]]);
    const rHole = asymSlit(128, 168, 24, 48, 12, 3);
    return uniteAll([ring, subtractAll(uniteAll([rStem, rBowl, rLeg]), [rHole])]);
  });

  // Trademark ™
  g['\u2122'] = makeSym('\u2122', 'trademark', () => {
    const tBar = rrect(0, 294, 110, 30, { tr: 12, bl: 10 });
    const tStem = rrect(30, 192, 50, 132, { bl: 12 });
    const mOuter = rrect(124, 192, 160, 132, { tr: 14, bl: 12 });
    const mS1 = rrect(170, 186, 18, 104, { tl: 10, tr: 3 });
    const mS2 = rrect(220, 186, 18, 104, { tl: 10, tr: 3 });
    const mDip = rpoly([[176, 330, 0], [232, 330, 0], [204, 298, 6]]);
    return uniteAll([tBar, tStem, subtractAll(mOuter, [mS1, mS2, mDip])]);
  });

  return g;
}

module.exports = { buildPunctuationGlyphs, asymDot };
