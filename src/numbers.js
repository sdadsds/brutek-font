const {
  rrect,
  asymSlit,
  rpoly,
  circle,
  smoothWaistCut,
  uniteAll,
  subtractAll,
  paperToSubpaths,
  bboxOfSubpaths,
  translateSubpaths,
  cleanupScope
} = require('./geometry');

const { CAP_H, STEM, BAR, SLIT } = require('./uppercase');

/**
 * TYPOGRAPHY101 Modular Numerals (0-9) — Precision Cleaned Edition
 * Lining display figures at Cap Height = 324.
 * Zero hanging spikes, zero stair-step seams, zero unintended notches.
 * Faithful heavy vertical stems (98-100), crisp thin horizontal bars (28-34),
 * signature asymmetric counter slits (40, tl/br=26, tr/bl=5), and smooth r=14 inner fillets.
 */

function makeNum(char, buildFn) {
  cleanupScope();
  const item = buildFn();
  let subpaths = paperToSubpaths(item);
  const bb = bboxOfSubpaths(subpaths);
  if (Math.abs(bb.minX) > 0.01) {
    subpaths = translateSubpaths(subpaths, -bb.minX, 0);
  }
  return {
    char,
    subpaths,
    bbox: bboxOfSubpaths(subpaths),
    source: 'designed-numbers'
  };
}

function buildNumberGlyphs() {
  const g = {};

  // 0: Clean capsule-oval (r=56 outer) with signature asymmetric counter slit & crisp diagonal bar
  g['0'] = makeNum('0', () => {
    const w = 236;
    const slitW = 40;
    const outer = rrect(0, 0, w, CAP_H, { tl: 56, tr: 56, br: 56, bl: 56 });
    const hole = asymSlit((w - slitW) / 2, BAR, slitW, CAP_H - 2 * BAR, 28, 5);
    const slash = rpoly([
      [(w - slitW) / 2 - 4, 134, 0],
      [(w + slitW) / 2 + 4, 174, 0],
      [(w + slitW) / 2 + 4, 198, 0],
      [(w - slitW) / 2 - 4, 158, 0]
    ]);
    return uniteAll([subtractAll(outer, [hole]), slash]);
  });

  // 1: Seamless heavy stem + clean top-left beak (zero top kink, zero 0.44u micro-line!)
  g['1'] = makeNum('1', () => {
    const w = 188;
    const stemX = w - STEM; // 88
    const stem = rrect(stemX, 0, STEM, CAP_H, { tl: 0, tr: 24, br: 0, bl: 24 });
    const beak = rpoly([
      [0, CAP_H - 64, 14],
      [0, CAP_H - 20, 16],
      [stemX, CAP_H, 0],
      [stemX + 30, CAP_H, 0],
      [stemX + 30, CAP_H - 64, 0]
    ]);
    return uniteAll([stem, beak]);
  });

  // 2: Razor-clean arch + continuous sweeping diagonal + flush z-style baseline bar!
  // Zero hanging spikes, zero outer-right stair-step, zero bottom-left shelf!
  g['2'] = makeNum('2', () => {
    const w = 236;
    const hookBot = 214;
    const barH = 34;

    // Single continuous outer body: diagonal outer-left meets (0, 0) flush with botBar (zero lip!)
    const archAndDiag = rpoly([
      [0, hookBot, 0],
      [0, CAP_H, 32],
      [w, CAP_H, 32],
      [w, 186, 26],
      [98, 0, 0],
      [0, 0, 0],
      [138, 194, 0],
      [138, CAP_H - BAR, 5],
      [98, CAP_H - BAR, 26],
      [98, hookBot, 14]
    ]);

    // Bottom bar starts cleanly inside the diagonal (x=32 > 24.2 at y=34) so bottom-left is 100% flush with zero step!
    const botBar = rrect(32, 0, w - 32, barH, { tl: 0, tr: 16, br: 24, bl: 0 });
    return uniteAll([archAndDiag, botBar]);
  });

  // 3: Flush right spine (zero step!), clean rounded middle bar (zero micro-notches!), twin asymmetric bays!
  g['3'] = makeNum('3', () => {
    const w = 236;
    const midY = 162;
    const halfB = BAR / 2; // 14
    const outer = rrect(0, 0, w, CAP_H, { tl: 26, tr: 32, br: 32, bl: 26 });

    // Top-left bay: open from x=-10..138, y=midY+halfB..CAP_H-72, plus asymmetric slit up to CAP_H-BAR
    const topGap = rrect(-10, midY + halfB, 148, (CAP_H - 72) - (midY + halfB));
    const topSlit = rrect(98, midY + halfB, 40, (CAP_H - BAR) - (midY + halfB), { tl: 26, tr: 5 });
    // Smooth r=14 inner fillet on the underside of the top-left arm at (98, CAP_H-72)
    const topArmFillet = subtractAll(
      rrect(98 - 14, CAP_H - 72, 14, 14),
      [rrect(98 - 28, CAP_H - 72, 28, 28, { br: 14 })]
    );

    // Bottom-left bay: open from x=-10..138, y=72..midY-halfB, plus asymmetric slit down to BAR
    const botGap = rrect(-10, 72, 148, (midY - halfB) - 72);
    const botSlit = rrect(98, BAR, 40, (midY - halfB) - BAR, { br: 26, bl: 5 });
    // Smooth r=14 inner fillet on the topside of the bottom-left arm at (98, 72)
    const botArmFillet = subtractAll(
      rrect(98 - 14, 72 - 14, 14, 14),
      [rrect(98 - 28, 72 - 28, 28, 28, { tr: 14 })]
    );

    // Trim left tip of middle crossbar cleanly well beyond x=44, then add ONE clean rounded crossbar tip!
    const midCut = rrect(-10, midY - halfB - 1, 66, BAR + 2);
    const carved = subtractAll(outer, [
      uniteAll([topGap, topSlit, topArmFillet]),
      uniteAll([botGap, botSlit, botArmFillet]),
      midCut
    ]);
    const cleanMidBar = rrect(44, midY - halfB, 110, BAR, { tl: 12, bl: 12 });
    return uniteAll([carved, cleanMidBar]);
  });

  // 4: Seamless continuous diagonal left arm flowing directly into crossbar (zero top-left dip!)
  g['4'] = makeNum('4', () => {
    const w = 248;
    const barY = 92;
    const barH = 34;
    const stemX = 122;
    const stemW = 98;
    const rightStem = rrect(stemX, 0, stemW, CAP_H, { tl: 0, tr: 24, br: 0, bl: 24 });
    // Continuous unified diagonal-to-crossbar polygon: zero seam at left nose!
    const leftAndBar = rpoly([
      [0, barY, 14],              // clean rounded bottom-left nose of 4
      [w, barY, 4],               // bottom-right of crossbar
      [w, barY + barH, 16],       // rounded top-right of crossbar
      [stemX + 30, barY + barH, 0],
      [stemX + 30, CAP_H, 0],
      [96, CAP_H, 16],            // smooth top-left peak of diagonal
      [0, barY + barH, 14]        // continuous diagonal meeting left nose cleanly!
    ]);
    const body = uniteAll([rightStem, leftAndBar]);
    // Clean inner counter triangle (y = barY+barH .. CAP_H-58, x = 76 .. stemX)
    const counter = rpoly([
      [74, barY + barH, 6],
      [stemX, barY + barH, 6],
      [stemX, CAP_H - 58, 12]
    ]);
    return subtractAll(body, [counter]);
  });

  // 5: Razor-clean flat top bar + heavy stem + smooth lower bowl (zero inner steps!)
  g['5'] = makeNum('5', () => {
    const w = 236;
    const midY = 178;
    const topBar = rrect(0, CAP_H - 34, w - 4, 34, { tl: 0, tr: 22, br: 6, bl: 0 });
    const leftStem = rrect(0, midY - 12, 98, CAP_H - (midY - 12), { tl: 0 });
    const botBox = rrect(0, 0, w, midY + 14, { tl: 0, tr: 28, br: 30, bl: 26 });
    const body = uniteAll([topBar, leftStem, botBox]);

    // Lower-left bay cut (y = 70 .. midY-14) + asymmetric slit down to BAR
    const botGap = rrect(-10, 70, 148, (midY - 14) - 70);
    const botSlit = rrect(98, BAR, 40, (midY - 14) - BAR, { br: 26, bl: 5 });
    const botArmFillet = subtractAll(
      rrect(98 - 14, 70 - 14, 14, 14),
      [rrect(98 - 28, 70 - 28, 28, 28, { tr: 14 })]
    );
    return subtractAll(body, [uniteAll([botGap, botSlit, botArmFillet])]);
  });

  // 6: Heavy lower bowl + sweeping top arch — ZERO slot notch into bowl bar, clean r=14 inner hook fillet!
  g['6'] = makeNum('6', () => {
    const w = 236;
    const bowlTop = 198;
    const outer = rrect(0, 0, w, CAP_H, { tl: 44, tr: 32, br: 30, bl: 30 });
    // Lower closed asymmetric counter (y = BAR .. bowlTop - BAR)
    const botHole = asymSlit(98, BAR, 40, (bowlTop - BAR) - BAR, 26, 5);
    // Upper-right open cutout starting FLUSH at y = bowlTop (no downward cut into bowl!)
    const hookY = CAP_H - 64;
    const topRightGap = rrect(98, bowlTop, w - 98 + 10, hookY - bowlTop);
    const topSlit = rrect(98, bowlTop, 40, (CAP_H - BAR) - bowlTop, { tl: 26, tr: 5 });
    // Smooth r=14 inner fillet on underside of top-right hook at (138, hookY)
    const hookFillet = subtractAll(
      rrect(138, hookY, 14, 14),
      [rrect(138, hookY, 28, 28, { bl: 14 })]
    );
    return subtractAll(outer, [botHole, uniteAll([topRightGap, topSlit, hookFillet])]);
  });

  // 7: Crisp horizontal top bar flowing seamlessly into diagonal leg (ZERO protruding top-right tab!)
  g['7'] = makeNum('7', () => {
    const w = 236;
    const barH = 36;
    // Built as ONE continuous polygon so right outer edge is a single clean unbroken line from (w, CAP_H) to (112, 0)!
    const body = rpoly([
      [0, CAP_H - barH, 14],      // clean bottom-left of top bar
      [0, CAP_H, 24],             // rounded top-left outer corner (matches z!)
      [w, CAP_H, 0],              // sharp top-right corner flowing straight into diagonal!
      [112, 0, 0],                // bottom-right base
      [12, 0, 18],                // bottom-left rounded base
      [126, CAP_H - barH, 8]      // smooth inner acute corner meeting top bar underside!
    ]);
    return body;
  });

  // 8: Clean continuous silhouette with C1-tangent smooth waist curves (zero kinks!) & twin asymmetric slits!
  g['8'] = makeNum('8', () => {
    const w = 238;
    const midY = 166;
    const outer = rrect(0, 0, w, CAP_H, { tl: 36, tr: 36, br: 36, bl: 36 });
    const waistL = smoothWaistCut(0, midY, 10, 56, 'left');
    const waistR = smoothWaistCut(w, midY, 10, 56, 'right');
    const topHole = asymSlit((w - 40) / 2, midY + BAR / 2, 40, CAP_H - BAR - (midY + BAR / 2), 26, 5);
    const botHole = asymSlit((w - 40) / 2, BAR, 40, (midY - BAR / 2) - BAR, 26, 5);
    return subtractAll(outer, [waistL, waistR, topHole, botHole]);
  });

  // 9: Exact optical 180-degree sibling of 6 — ZERO slot notch into upper bowl, clean r=14 inner hook fillet!
  g['9'] = makeNum('9', () => {
    const w = 236;
    const bowlBot = 126;
    const outer = rrect(0, 0, w, CAP_H, { tl: 30, tr: 30, br: 44, bl: 32 });
    // Upper closed asymmetric counter (y = bowlBot + BAR .. CAP_H - BAR)
    const topHole = asymSlit(98, bowlBot + BAR, 40, (CAP_H - BAR) - (bowlBot + BAR), 26, 5);
    // Lower-left open cutout stopping FLUSH at y = bowlBot (no upward cut into bowl!)
    const hookY = 64;
    const botLeftGap = rrect(-10, hookY, 148, bowlBot - hookY);
    const botSlit = rrect(98, BAR, 40, bowlBot - BAR, { br: 26, bl: 5 });
    // Smooth r=14 inner fillet on topside of bottom-left hook at (98, hookY)
    const hookFillet = subtractAll(
      rrect(98 - 14, hookY - 14, 14, 14),
      [rrect(98 - 28, hookY - 28, 28, 28, { tr: 14 })]
    );
    return subtractAll(outer, [topHole, uniteAll([botLeftGap, botSlit, hookFillet])]);
  });

  return g;
}

module.exports = { buildNumberGlyphs };
