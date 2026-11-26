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

/**
 * TYPOGRAPHY101 Modular Uppercase Design System (A-Z)
 *
 * Faithful geometric parameters derived directly from TYPOGRAPHY101.ai:
 * - Lowercase x-height = 216, ascender = 327, descender = -73
 * - Lowercase stem = 93-94, bar = 24, counter slit = 30
 * - Uppercase capHeight = 324 (aligned with ascender 327)
 * - Uppercase stem = 100, bar = 28, counter slit = 40
 * - Signature asymmetric slit radii: tl=28, br=28, tr=5, bl=5
 * - Selective outer corner rounding: r=24-26 paired with crisp sharp corners
 */

const CAP_H = 324;
const STEM = 100;
const BAR = 28;
const SLIT = 40;
const W = 240; // 100 + 40 + 100
const R_OUT = 26;
const R_BIG = 28;
const R_SM = 5;

function makeGlyph(char, buildFn, source = 'designed-uppercase') {
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
    source
  };
}

function buildUppercaseGlyphs() {
  const g = {};

  // A: Chamfered top apex (mirroring v's iconic V-chamfer!), asymmetric upper counter + open bottom asymmetric slit
  g.A = makeGlyph('A', () => {
    const w = 248;
    const slitW = 40;
    const slitX = (w - slitW) / 2;
    const outer = rpoly([
      [0, 0, 0],
      [w, 0, 0],
      [w, 178, 12],
      [w / 2 + 24, CAP_H, 16],
      [w / 2 - 24, CAP_H, 16],
      [0, 178, 12]
    ]);
    const outerFix = subtractAll(outer, [
      subtractAll(rrect(0, 0, 26, 26), [rrect(0, 0, 52, 52, { bl: 24 })])
    ]);
    const upperHole = asymSlit(slitX, 132, slitW, 148, 26, 5);
    const lowerCut = rrect(slitX, -10, slitW, 114, { tl: 26, tr: 5 });
    const rightLegFootCut = subtractAll(
      rrect(slitX + slitW, 0, 24, 24),
      [rrect(slitX + slitW, 0, 48, 48, { bl: 24 })]
    );
    return subtractAll(outerFix, [upperHole, lowerCut, rightLegFootCut]);
  });

  // B: Heavy left stem + smooth C1-tangent waist curve on right spine (zero kinks!) and twin asymmetric counters
  g.B = makeGlyph('B', () => {
    const w = 244;
    const midY = 166;
    const outer = rrect(0, 0, w, CAP_H, { tl: 0, tr: 36, br: 36, bl: 24 });
    const waistR = smoothWaistCut(w, midY, 10, 56, 'right');
    const topHole = asymSlit(100, midY + BAR / 2, 40, CAP_H - BAR - (midY + BAR / 2), 26, 5);
    const botHole = asymSlit(100, BAR, 40, (midY - BAR / 2) - BAR, 26, 5);
    return subtractAll(outer, [waistR, topHole, botHole]);
  });

  // C: Monumental capital brother of lowercase c
  g.C = makeGlyph('C', () => {
    const outer = rrect(0, 0, W, CAP_H, { tl: R_OUT, tr: R_OUT, br: R_OUT, bl: R_OUT });
    const openY0 = 116, openY1 = 208;
    const cavityTop = rrect(STEM, openY1 - 14, SLIT, CAP_H - BAR - (openY1 - 14), { tl: R_BIG, tr: R_SM });
    const cavityBot = rrect(STEM, BAR, SLIT, (openY0 + 14) - BAR, { br: R_BIG, bl: R_SM });
    const cavityMid = rrect(STEM, openY0, W - STEM + 10, openY1 - openY0);
    const topFillet = subtractAll(
      rrect(STEM + SLIT, openY1, 14, 14),
      [rrect(STEM + SLIT, openY1, 28, 28, { bl: 14 })]
    );
    const botFillet = subtractAll(
      rrect(STEM + SLIT, openY0 - 14, 14, 14),
      [rrect(STEM + SLIT, openY0 - 28, 28, 28, { tl: 14 })]
    );
    return subtractAll(outer, [uniteAll([cavityTop, cavityBot, cavityMid, topFillet, botFillet])]);
  });

  // D: Heavy straight left spine + sculpted large right curves (r=64) + asymmetric slit
  g.D = makeGlyph('D', () => {
    const w = 244;
    const outer = rrect(0, 0, w, CAP_H, { tl: 0, tr: 64, br: 64, bl: 24 });
    const hole = asymSlit(STEM, BAR, SLIT, CAP_H - 2 * BAR, R_BIG, R_SM);
    return subtractAll(outer, [hole]);
  });

  // E: Heavy left stem + sculptural top/bottom terminals + clean rounded middle bar (zero micro-step!)
  g.E = makeGlyph('E', () => {
    const w = 232;
    const midY = 148;
    const outer = rrect(0, 0, w, CAP_H, { tl: 0, tr: 26, br: 26, bl: 24 });
    const topBaySlit = rrect(STEM, midY + BAR, SLIT, CAP_H - BAR - (midY + BAR), { tl: 26, tr: 5, br: 14, bl: 5 });
    const topBayOpen = rrect(STEM + 14, midY + BAR, w - STEM, (CAP_H - 68) - (midY + BAR), { tl: 14 });
    const botBaySlit = rrect(STEM, BAR, SLIT, midY - BAR, { tl: 5, tr: 14, br: 26, bl: 5 });
    const botBayOpen = rrect(STEM + 14, 68, w - STEM, midY - 68, { bl: 14 });
    const midTrim = rrect(w - 40, midY - 2, 50, BAR + 4);
    const base = subtractAll(outer, [uniteAll([topBaySlit, topBayOpen]), uniteAll([botBaySlit, botBayOpen]), midTrim]);
    const midCap = rrect(STEM, midY, w - STEM - 16, BAR, { tr: 14, br: 6 });
    return uniteAll([base, midCap]);
  });

  // F: Upper architecture matching E, crisp open lower-right (zero micro-step!)
  g.F = makeGlyph('F', () => {
    const w = 228;
    const midY = 148;
    const outer = rrect(0, 0, w, CAP_H, { tl: 0, tr: 26, br: 0, bl: 24 });
    const topBaySlit = rrect(STEM, midY + BAR, SLIT, CAP_H - BAR - (midY + BAR), { tl: 26, tr: 5, br: 14, bl: 5 });
    const topBayOpen = rrect(STEM + 14, midY + BAR, w - STEM, (CAP_H - 68) - (midY + BAR), { tl: 14 });
    const botCut = rrect(STEM, -10, w - STEM + 10, midY + 10, { tl: 14 });
    const midTrim = rrect(w - 44, midY - 2, 54, BAR + 4);
    const base = subtractAll(outer, [uniteAll([topBaySlit, topBayOpen]), botCut, midTrim]);
    const midCap = rrect(STEM, midY, w - STEM - 20, BAR, { tr: 14, br: 6 });
    return uniteAll([base, midCap]);
  });

  // G: Built on C with cleanly integrated inward-turning crossbar spur
  g.G = makeGlyph('G', () => {
    const w = 244;
    const outer = rrect(0, 0, w, CAP_H, { tl: R_OUT, tr: R_OUT, br: R_OUT, bl: R_OUT });
    const openY0 = 158, openY1 = 236;
    const cavityTop = rrect(STEM, openY1 - 14, SLIT, CAP_H - BAR - (openY1 - 14), { tl: R_BIG, tr: R_SM });
    const cavityBot = rrect(STEM, BAR, SLIT, (openY0 + 14) - BAR, { br: R_BIG, bl: R_SM });
    const cavityGap = rrect(STEM, openY0, w - STEM + 10, openY1 - openY0);
    const topFillet = subtractAll(
      rrect(STEM + SLIT, openY1, 14, 14),
      [rrect(STEM + SLIT, openY1, 28, 28, { bl: 14 })]
    );
    const cShape = subtractAll(outer, [uniteAll([cavityTop, cavityBot, cavityGap, topFillet])]);
    // Cleanly integrated horizontal spur shelf aligned with right outer edge (x=118..w, y=130..158)
    const spur = rrect(118, 130, w - 118, 28, { tl: 10, tr: 12, bl: 10, br: 0 });
    return uniteAll([cShape, spur]);
  });

  // H: Twin heavy stems (100) + 40 slit + 28 crossbar at mid-height, twin opposing asymmetric slits!
  g.H = makeGlyph('H', () => {
    const midY = 148;
    const outer = rrect(0, 0, W, CAP_H, { tl: 0, tr: 24, br: 0, bl: 24 });
    const topSlit = rrect(STEM, midY + BAR, SLIT, CAP_H - (midY + BAR) + 10, { br: R_BIG, bl: R_SM });
    const botSlit = rrect(STEM, -10, SLIT, midY + 10, { tl: R_BIG, tr: R_SM });
    const tlInner = subtractAll(rrect(STEM - 24, CAP_H - 24, 24, 24), [rrect(STEM - 48, CAP_H - 48, 48, 48, { tr: 24 })]);
    const brInner = subtractAll(rrect(STEM + SLIT, 0, 24, 24), [rrect(STEM + SLIT, 0, 48, 48, { bl: 24 })]);
    return subtractAll(outer, [topSlit, botSlit, tlInner, brInner]);
  });

  // I: Solid 100 x 324 stem with signature top-right & bottom-left r=24 rounding
  g.I = makeGlyph('I', () => {
    return rrect(0, 0, STEM, CAP_H, { tl: 0, tr: 24, br: 0, bl: 24 });
  });

  // J: Sweeping hooked base echoing lowercase j's exact curve & hook tip
  g.J = makeGlyph('J', () => {
    const w = 188;
    const outer = rrect(0, 0, w, CAP_H, { tl: 0, tr: 24, br: 76, bl: 14 });
    const hookH = 44;
    const cut = rrect(-10, hookH, (w - STEM) + 10, CAP_H - hookH + 10, { br: 24 });
    // Sculpt left tip of hook with rounded top-left (like lowercase j!)
    const tipRound = subtractAll(rrect(0, hookH - 20, 20, 20), [rrect(0, 0, 44, hookH, { tl: 20 })]);
    return subtractAll(outer, [cut, tipRound]);
  });

  // K: Razor-clean heavy left stem + upper diagonal arm + unbroken sweeping lower leg (ZERO inner micro-cut!)
  g.K = makeGlyph('K', () => {
    const w = 248;
    const stem = rrect(0, 0, STEM, CAP_H, { tl: 0, tr: 24, br: 0, bl: 24 });
    const upperArm = rpoly([
      [STEM - 16, 152, 0],
      [w - 94, CAP_H, 16],
      [w, CAP_H, 24],
      [STEM + 56, 160, 12]
    ]);
    // Single unbroken straight inner edge from (STEM, 128) cleanly down to (w - 96, 0)!
    const lowerLeg = rpoly([
      [STEM - 10, 184, 0],
      [STEM + 66, 178, 8],
      [w, 0, 0],
      [w - 96, 0, 18],
      [STEM - 10, 144, 0]
    ]);
    return uniteAll([stem, upperArm, lowerLeg]);
  });

  // L: Heavy left stem + bold sculptural foot with mathematically tangent inner elbow fillet (zero 2u micro-step!)
  g.L = makeGlyph('L', () => {
    const w = 224;
    const stem = rrect(0, 0, STEM, CAP_H, { tl: 0, tr: 24, br: 0, bl: 26 });
    const foot = rrect(0, 0, w, 46, { tl: 0, tr: 18, br: 24, bl: 26 });
    const body = uniteAll([stem, foot]);
    // Exact tangent fillet block at (STEM, 46): radius = 20 tangent to x=STEM and y=46!
    const filletAdd = rrect(STEM - 2, 44, 22, 22);
    const filletCut = rrect(STEM, 46, 44, 44, { bl: 20 });
    return subtractAll(uniteAll([body, filletAdd]), [filletCut]);
  });

  // M: Monumental 3-stem architecture with rounded V-crotch at top + twin asymmetric bottom slits
  g.M = makeGlyph('M', () => {
    const w = 340;
    const outer = rrect(0, 0, w, CAP_H, { tl: 0, tr: 24, br: 0, bl: 24 });
    const slit1 = rrect(98, -10, 36, 248, { tl: 24, tr: 5 });
    const slit2 = rrect(206, -10, 36, 248, { tl: 24, tr: 5 });
    const topDip = rpoly([
      [110, CAP_H + 10, 0],
      [230, CAP_H + 10, 0],
      [170, CAP_H - 56, 18]
    ]);
    const leg2Foot = subtractAll(rrect(134, 0, 22, 22), [rrect(134, 0, 44, 44, { bl: 22 })]);
    const leg3Foot = subtractAll(rrect(242, 0, 22, 22), [rrect(242, 0, 44, 44, { bl: 22 })]);
    return subtractAll(outer, [slit1, slit2, topDip, leg2Foot, leg3Foot]);
  });

  // N: Two heavy stems + bold diagonal bridge
  g.N = makeGlyph('N', () => {
    const w = 252;
    const sW = 96;
    const leftStem = rrect(0, 0, sW, CAP_H, { tl: 0, tr: 16, br: 0, bl: 24 });
    const rightStem = rrect(w - sW, 0, sW, CAP_H, { tl: 0, tr: 24, br: 0, bl: 16 });
    const diag = rpoly([
      [12, CAP_H, 0],
      [sW + 2, CAP_H, 12],
      [w - 12, 0, 0],
      [w - sW - 2, 0, 12]
    ]);
    return uniteAll([leftStem, rightStem, diag]);
  });

  // O: Monumental 244 x 324 rounded rectangle with signature asymmetric counter slit
  g.O = makeGlyph('O', () => {
    const w = 244;
    const outer = rrect(0, 0, w, CAP_H, { tl: 34, tr: 34, br: 34, bl: 34 });
    const hole = asymSlit((w - SLIT) / 2, BAR, SLIT, CAP_H - 2 * BAR, R_BIG, R_SM);
    return subtractAll(outer, [hole]);
  });

  // P: Heavy left stem + upper bowl with asymmetric counter slit
  g.P = makeGlyph('P', () => {
    const w = 240;
    const bowlBot = 124;
    const stem = rrect(0, 0, STEM, CAP_H, { tl: 0, tr: 0, br: 0, bl: 24 });
    const bowl = rrect(0, bowlBot, w, CAP_H - bowlBot, { tl: 0, tr: 30, br: 30, bl: 0 });
    const body = uniteAll([stem, bowl]);
    const hole = asymSlit(STEM, bowlBot + BAR, SLIT, (CAP_H - BAR) - (bowlBot + BAR), R_BIG, R_SM);
    return subtractAll(body, [hole]);
  });

  // Q: O + bold sculptural curved/angled lower-right tail
  g.Q = makeGlyph('Q', () => {
    const w = 244;
    const outer = rrect(0, 0, w, CAP_H, { tl: 34, tr: 34, br: 34, bl: 34 });
    const hole = asymSlit((w - SLIT) / 2, BAR, SLIT, CAP_H - 2 * BAR, R_BIG, R_SM);
    const oShape = subtractAll(outer, [hole]);
    const tail = rpoly([
      [148, 36, 12],
      [216, 48, 12],
      [w + 22, -44, 18],
      [w - 46, -44, 18]
    ]);
    return uniteAll([oShape, tail]);
  });

  // R: P's upper bowl + clean unbroken angled leg (ZERO inner micro-cut!)
  g.R = makeGlyph('R', () => {
    const w = 244;
    const bowlBot = 132;
    const stem = rrect(0, 0, STEM, CAP_H, { tl: 0, tr: 0, br: 0, bl: 24 });
    const bowl = rrect(0, bowlBot, w - 4, CAP_H - bowlBot, { tl: 0, tr: 30, br: 28, bl: 0 });
    const leg = rpoly([
      [STEM - 4, bowlBot + 24, 0],
      [STEM + 88, bowlBot + 24, 0],
      [w + 4, 0, 0],
      [w - 94, 0, 18],
      [STEM - 4, bowlBot + 2, 0]
    ]);
    const body = uniteAll([stem, bowl, leg]);
    const hole = asymSlit(STEM, bowlBot + BAR, SLIT, (CAP_H - BAR) - (bowlBot + BAR), R_BIG, R_SM);
    return subtractAll(body, [hole]);
  });

  // S: Monumental tall brother of lowercase s
  g.S = makeGlyph('S', () => {
    const w = 240;
    const outer = rrect(0, 0, w, CAP_H, { tl: 26, tr: 26, br: 26, bl: 26 });
    const midY = 162;
    const midHalf = BAR / 2;
    const topCutH = 44;
    const topGapY0 = midY + midHalf;
    const topGapY1 = topGapY0 + topCutH;
    const botGapY1 = midY - midHalf;
    const botGapY0 = botGapY1 - topCutH;

    const tSlit = rrect(STEM, topGapY0, SLIT, (CAP_H - BAR) - topGapY0, { tl: 26, tr: 5, bl: 16 });
    const tGap = rrect(STEM, topGapY0, w - STEM + 10, topGapY1 - topGapY0, { tl: 16, bl: 16 });
    const tFillet = subtractAll(
      rrect(STEM + SLIT, topGapY1, 14, 14),
      [rrect(STEM + SLIT, topGapY1, 28, 28, { bl: 14 })]
    );

    const bSlit = rrect(STEM, BAR, SLIT, botGapY1 - BAR, { br: 26, bl: 5, tr: 16 });
    const bGap = rrect(-10, botGapY0, STEM + SLIT + 10, botGapY1 - botGapY0, { tr: 16, br: 16 });
    const bFillet = subtractAll(
      rrect(STEM - 14, botGapY0 - 14, 14, 14),
      [rrect(STEM - 28, botGapY0 - 28, 28, 28, { tr: 14 })]
    );

    return subtractAll(outer, [uniteAll([tSlit, tGap, tFillet]), uniteAll([bSlit, bGap, bFillet])]);
  });

  // T: Sculptural top bar + centered heavy stem
  g.T = makeGlyph('T', () => {
    const w = 248;
    const barH = 44;
    const topBar = rrect(0, CAP_H - barH, w, barH, { tl: 0, tr: 24, br: 0, bl: 20 });
    const stemX = (w - STEM) / 2;
    const stem = rrect(stemX, 0, STEM, CAP_H, { tl: 0, tr: 0, br: 0, bl: 24 });
    return uniteAll([topBar, stem]);
  });

  // U: Monumental capital brother of lowercase u
  g.U = makeGlyph('U', () => {
    const outer = rrect(0, 0, W, CAP_H, { tl: 0, tr: 24, br: 26, bl: 26 });
    const slit = rrect(STEM, BAR, SLIT, CAP_H - BAR + 10, { br: R_BIG, bl: R_SM });
    const tlInner = subtractAll(rrect(STEM - 24, CAP_H - 24, 24, 24), [rrect(STEM - 48, CAP_H - 48, 48, 48, { tr: 24 })]);
    return subtractAll(outer, [slit, tlInner]);
  });

  // V: Monumental capital brother of lowercase v
  g.V = makeGlyph('V', () => {
    const w = 248;
    const slitW = 40;
    const slitX = (w - slitW) / 2;
    const outer = rpoly([
      [0, CAP_H, 0],
      [w, CAP_H, 24],
      [w, 134, 14],
      [w / 2 + 24, 0, 16],
      [w / 2 - 24, 0, 16],
      [0, 134, 14]
    ]);
    const slit = rrect(slitX, 34, slitW, CAP_H - 34 + 10, { br: 26, bl: 5 });
    const tlInner = subtractAll(rrect(slitX - 24, CAP_H - 24, 24, 24), [rrect(slitX - 48, CAP_H - 48, 48, 48, { tr: 24 })]);
    return subtractAll(outer, [slit, tlInner]);
  });

  // W: Monumental capital brother of lowercase w
  g.W = makeGlyph('W', () => {
    const w = 340;
    const s1X = 98, s1W = 36;
    const s2X = 206, s2W = 36;
    const outer = rpoly([
      [0, CAP_H, 0],
      [w, CAP_H, 24],
      [w, 136, 14],
      [252, 0, 16],
      [212, 0, 16],
      [170, 32, 8],
      [128, 0, 16],
      [88, 0, 16],
      [0, 136, 14]
    ]);
    const slit1 = rrect(s1X, 34, s1W, CAP_H - 34 + 10, { br: 24, bl: 5 });
    const slit2 = rrect(s2X, 34, s2W, CAP_H - 34 + 10, { br: 24, bl: 5 });
    const r1 = subtractAll(rrect(s1X - 22, CAP_H - 22, 22, 22), [rrect(s1X - 44, CAP_H - 44, 44, 44, { tr: 22 })]);
    const r2 = subtractAll(rrect(s2X - 22, CAP_H - 22, 22, 22), [rrect(s2X - 44, CAP_H - 44, 44, 44, { tr: 22 })]);
    return subtractAll(outer, [slit1, slit2, r1, r2]);
  });

  // X: Faithful monumental brother of lowercase x — heavy \ stroke + stepped/curved / stroke with signature waist notch!
  g.X = makeGlyph('X', () => {
    const w = 256;
    const strokeW = 104;
    const d1 = rpoly([
      [0, CAP_H, 0],
      [strokeW, CAP_H, 0],
      [w, 0, 0],
      [w - strokeW, 0, 0]
    ]);
    const d2 = rpoly([
      [w - 86, CAP_H, 24],
      [w, CAP_H, 0],
      [86, 0, 24],
      [0, 0, 0]
    ]);
    const cross = uniteAll([d1, d2]);
    // Signature horizontal waist-cut notches matching lowercase x's iconic silhouette!
    const topNotch = rpoly([
      [strokeW - 4, CAP_H + 4, 0],
      [w - 82, CAP_H + 4, 0],
      [w / 2, CAP_H - 110, 16]
    ]);
    const botNotch = rpoly([
      [82, -4, 0],
      [w - strokeW + 4, -4, 0],
      [w / 2, 110, 16]
    ]);
    return subtractAll(cross, [topNotch, botNotch]);
  });

  // Y: Upper chamfered V-fork converging into centered 100-wide stem
  g.Y = makeGlyph('Y', () => {
    const w = 252;
    const slitW = 40;
    const slitX = (w - slitW) / 2;
    const forkY = 128;
    const upper = rpoly([
      [0, CAP_H, 0],
      [w, CAP_H, 24],
      [w, 200, 14],
      [(w + STEM) / 2, forkY, 12],
      [(w - STEM) / 2, forkY, 12],
      [0, 200, 14]
    ]);
    const stem = rrect((w - STEM) / 2, 0, STEM, forkY + 30, { bl: 24 });
    const body = uniteAll([upper, stem]);
    const slit = rrect(slitX, forkY + 26, slitW, CAP_H - (forkY + 26) + 10, { br: 26, bl: 5 });
    const tlInner = subtractAll(rrect(slitX - 24, CAP_H - 24, 24, 24), [rrect(slitX - 48, CAP_H - 48, 48, 48, { tr: 24 })]);
    return subtractAll(body, [slit, tlInner]);
  });

  // Z: Monumental capital brother of lowercase z — flush diagonal outer corners (ZERO lips at top-right or bottom-left!)
  g.Z = makeGlyph('Z', () => {
    const w = 248;
    const barH = 34;
    // Slash goes from (w-102, CAP_H)..(w, CAP_H) down to (0, 0)..(102, 0)
    // At y=barH (34), left edge of slash is at x = (w-102)*(34/324) = 15.3 -> botBar starts at x=30 inside slash!
    // At y=CAP_H-barH (290), right edge of slash is at x = w - 15.3 -> topBar ends at x=w-30 inside slash!
    const topBar = rrect(0, CAP_H - barH, w - 30, barH, { tl: 26, tr: 0, br: 0, bl: 6 });
    const botBar = rrect(30, 0, w - 30, barH, { tl: 0, tr: 6, br: 26, bl: 0 });
    const slash = rpoly([
      [w - 102, CAP_H, 0],
      [w, CAP_H, 0],
      [102, 0, 0],
      [0, 0, 0]
    ]);
    return uniteAll([topBar, botBar, slash]);
  });

  return g;
}

module.exports = { buildUppercaseGlyphs, CAP_H, STEM, BAR, SLIT, makeGlyph };
