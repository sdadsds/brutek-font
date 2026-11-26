const fs = require('fs');
const {
  subpathsToPaper,
  paperToSubpaths,
  uniteAll,
  translateSubpaths,
  bboxOfSubpaths,
  cleanupScope
} = require('./geometry');

const BASELINE = 942.0638;

/**
 * Extracts all 26 original lowercase glyphs a-z + emblem + alt-y
 * directly from the parsed TYPOGRAPHY101.ai vector data with lossless Bezier fidelity.
 * Multi-part overlapping glyphs (t, y) are cleanly boolean-unioned;
 * multi-part disjoint glyphs (i, j) keep both clean contours.
 * Stray micro-dust artifacts are filtered out.
 */
function loadOriginalGlyphs() {
  const shapes = JSON.parse(fs.readFileSync('E:/Projects/typography101-font/scripts/extracted_raw.json', 'utf8'));

  const spec = {
    a: { ids: [6], union: false },
    b: { ids: [8], union: false },
    c: { ids: [1], union: false },
    d: { ids: [9], union: false },
    e: { ids: [3], union: false },
    f: { ids: [10], union: false },
    g: { ids: [4], union: false },
    h: { ids: [11], union: false },
    i: { ids: [12, 13], union: false },
    j: { ids: [18, 20], union: false },
    k: { ids: [28], union: false },
    l: { ids: [19], union: false },
    m: { ids: [32], union: false },
    n: { ids: [17], union: false },
    o: { ids: [2], union: false },
    p: { ids: [26], union: false },
    q: { ids: [27], union: false },
    r: { ids: [29], union: false },
    s: { ids: [37], union: false }, // #16 is redundant interior rect
    t: { ids: [14, 15], union: true },
    u: { ids: [21], union: false },
    v: { ids: [24], union: false },
    w: { ids: [25], union: false },
    x: { ids: [41], union: false },
    y: { ids: [22, 5, 23], union: true },
    z: { ids: [35], union: false },
  };

  const glyphs = {};

  for (const [ch, cfg] of Object.entries(spec)) {
    cleanupScope();
    const parts = cfg.ids.map(id => shapes[id]);
    const minX = Math.min(...parts.map(s => s.bbox.minX));
    // Normalize x so left edge is at x=0, and baseline is at y=0
    // Slight baseline snap for l, v, z which were 1u below 942.0638
    const yOffset = (ch === 'l' || ch === 'v' || ch === 'z') ? (BASELINE - 1.0) : BASELINE;

    let subpaths;
    if (cfg.union) {
      const pItems = parts.map(s => subpathsToPaper(translateSubpaths(s.subpaths, -minX, -yOffset)));
      const merged = uniteAll(pItems);
      subpaths = paperToSubpaths(merged);
    } else {
      // Pass through paperToSubpaths to ensure exact consistent CFF winding order & drop micro-dust
      const allSp = [];
      for (const s of parts) {
        const shifted = translateSubpaths(s.subpaths, -minX, -yOffset);
        const pItem = subpathsToPaper(shifted);
        const cleanSp = paperToSubpaths(pItem);
        allSp.push(...cleanSp);
      }
      subpaths = allSp;
    }

    const bb = bboxOfSubpaths(subpaths);
    // Shift cleanly so minX === 0
    if (Math.abs(bb.minX) > 0.01) {
      subpaths = translateSubpaths(subpaths, -bb.minX, 0);
    }

    // Also store dotless i for accented i glyphs
    glyphs[ch] = {
      char: ch,
      subpaths,
      bbox: bboxOfSubpaths(subpaths),
      source: 'original'
    };
  }

  // Dotless i (U+0131) extracted directly from shape #12
  {
    cleanupScope();
    const s = shapes[12];
    const shifted = translateSubpaths(s.subpaths, -s.bbox.minX, -BASELINE);
    const cleanSp = paperToSubpaths(subpathsToPaper(shifted));
    glyphs['\u0131'] = {
      char: '\u0131',
      name: 'dotlessi',
      subpaths: cleanSp,
      bbox: bboxOfSubpaths(cleanSp),
      source: 'original-derived'
    };
  }

  // Dotless j (U+0237) extracted directly from shape #18
  {
    cleanupScope();
    const s = shapes[18];
    const shifted = translateSubpaths(s.subpaths, -s.bbox.minX, -BASELINE);
    const cleanSp = paperToSubpaths(subpathsToPaper(shifted));
    glyphs['\u0237'] = {
      char: '\u0237',
      name: 'dotlessj',
      subpaths: cleanSp,
      bbox: bboxOfSubpaths(cleanSp),
      source: 'original-derived'
    };
  }

  // Emblem / Logo mark (PUA U+E000) scaled nicely to capHeight 324
  {
    cleanupScope();
    const s = shapes[40];
    const scale = 324 / s.bbox.h;
    const shifted = translateSubpaths(s.subpaths, -s.bbox.minX, -s.bbox.minY);
    const scaled = shifted.map(sp => sp.map(cmd => {
      if (cmd.type === 'Z') return { type: 'Z' };
      if (cmd.type === 'C') return { type: 'C', x1: cmd.x1 * scale, y1: cmd.y1 * scale, x2: cmd.x2 * scale, y2: cmd.y2 * scale, x: cmd.x * scale, y: cmd.y * scale };
      return { type: cmd.type, x: cmd.x * scale, y: cmd.y * scale };
    }));
    const cleanSp = paperToSubpaths(subpathsToPaper(scaled));
    glyphs['\uE000'] = {
      char: '\uE000',
      name: 'logo',
      subpaths: cleanSp,
      bbox: bboxOfSubpaths(cleanSp),
      source: 'original-emblem'
    };
  }

  // Alternate diagonal y (PUA U+E001)
  {
    cleanupScope();
    const s = shapes[42];
    const shifted = translateSubpaths(s.subpaths, -s.bbox.minX, -s.bbox.minY);
    const cleanSp = paperToSubpaths(subpathsToPaper(shifted));
    glyphs['\uE001'] = {
      char: '\uE001',
      name: 'y.alt',
      subpaths: cleanSp,
      bbox: bboxOfSubpaths(cleanSp),
      source: 'original-alt'
    };
  }

  return glyphs;
}

module.exports = { loadOriginalGlyphs, BASELINE };
