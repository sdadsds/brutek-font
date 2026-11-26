const paper = require('paper');

// Initialize headless Paper.js scope once
const scope = new paper.PaperScope();
scope.setup(new scope.Size(4000, 4000));

const KAPPA = 0.5522847498307936;

/**
 * Convert a list of subpaths (in Y-up font coordinates) to a Paper.js CompoundPath or Path
 * Note: Paper.js uses Y-down internally, so we flip Y on import and flip back on export.
 */
function subpathsToPaper(subpaths) {
  const paths = [];
  for (const sp of subpaths) {
    const p = new scope.Path();
    let curX = 0, curY = 0;
    for (const cmd of sp) {
      if (cmd.type === 'M') {
        p.moveTo(new scope.Point(cmd.x, -cmd.y));
        curX = cmd.x; curY = cmd.y;
      } else if (cmd.type === 'L') {
        p.lineTo(new scope.Point(cmd.x, -cmd.y));
        curX = cmd.x; curY = cmd.y;
      } else if (cmd.type === 'C') {
        p.cubicCurveTo(
          new scope.Point(cmd.x1, -cmd.y1),
          new scope.Point(cmd.x2, -cmd.y2),
          new scope.Point(cmd.x, -cmd.y)
        );
        curX = cmd.x; curY = cmd.y;
      } else if (cmd.type === 'Z') {
        p.closePath();
      }
    }
    if (p.segments.length >= 2) {
      p.closed = true;
      paths.push(p);
    }
  }
  if (paths.length === 0) return new scope.Path();
  if (paths.length === 1) return paths[0];
  const cp = new scope.CompoundPath({ children: paths });
  cp.fillRule = 'evenodd';
  return cp;
}

/**
 * Export a Paper.js Path or CompoundPath back to Y-up subpaths: [{type:'M'|'L'|'C'|'Z', ...}]
 * Ensures proper OpenType/PostScript CFF winding: outer = CCW (or CW depending on convention;
 * for CFF/OTF outer=CCW in Y-up, holes=CW in Y-up; for TTF outer=CW in Y-up, holes=CCW).
 * We normalize outer contours to CCW in Y-up (area > 0) and holes to CW (area < 0),
 * and callers can flip if needed for TTF.
 */
function paperToSubpaths(item) {
  if (!item) return [];
  const children = item.className === 'CompoundPath' ? item.children : [item];
  const raw = [];

  for (const ch of children) {
    if (!ch.segments || ch.segments.length < 2) continue;
    const area = ch.area; // In Y-down (Paper): CW is positive, CCW is negative
    if (Math.abs(area) < 1.0) continue; // drop micro-dust

    const sp = [];
    const segs = ch.segments;
    const n = segs.length;
    const first = segs[0].point;
    sp.push({ type: 'M', x: first.x, y: -first.y });

    for (let i = 0; i < n; i++) {
      const s0 = segs[i];
      const s1 = segs[(i + 1) % n];
      const hOut = s0.handleOut;
      const hIn = s1.handleIn;
      const isLine = Math.hypot(hOut.x, hOut.y) < 1e-4 && Math.hypot(hIn.x, hIn.y) < 1e-4;
      if (isLine) {
        if (Math.hypot(s1.point.x - s0.point.x, s1.point.y - s0.point.y) > 1e-4) {
          sp.push({ type: 'L', x: s1.point.x, y: -s1.point.y });
        }
      } else {
        const c1x = s0.point.x + hOut.x;
        const c1y = -(s0.point.y + hOut.y);
        const c2x = s1.point.x + hIn.x;
        const c2y = -(s1.point.y + hIn.y);
        sp.push({ type: 'C', x1: c1x, y1: c1y, x2: c2x, y2: c2y, x: s1.point.x, y: -s1.point.y });
      }
    }
    sp.push({ type: 'Z' });
    raw.push({ sp, ch });
  }

  // Fix winding order via containment test in Paper.js
  // Even depth (0, 2, ...) => outer contour => want CCW in Y-up (area > 0 in Y-up => area < 0 in Y-down? Wait:
  // In Paper.js (Y-down): a clockwise square (0,0)->(10,0)->(10,10)->(0,10) has area = +100.
  // When Y is negated to Y-up: (0,0)->(10,0)->(10,-10)->(0,-10), which is CLOCKWISE in Y-up!
  // Let's verify: (0,0) -> right to (10,0) -> down to (10,-10) -> left to (0,-10) -> up to (0,0): CLOCKWISE!
  // So Paper area > 0 === CW in Y-up! Paper area < 0 === CCW in Y-up!
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i].ch;
    const testPt = ch.getPointAt(ch.length * 0.25) || ch.segments[0].point;
    let depth = 0;
    for (let j = 0; j < raw.length; j++) {
      if (i === j) continue;
      if (raw[j].ch.contains(testPt)) depth++;
    }
    const wantCCW_Yup = (depth % 2 === 0); // outer = CCW in Y-up (CFF standard)
    const isCCW_Yup = ch.area < 0;
    if (wantCCW_Yup !== isCCW_Yup) {
      ch.reverse();
      // re-extract reversed
      const segs = ch.segments;
      const n = segs.length;
      const sp = [{ type: 'M', x: segs[0].point.x, y: -segs[0].point.y }];
      for (let k = 0; k < n; k++) {
        const s0 = segs[k];
        const s1 = segs[(k + 1) % n];
        const hOut = s0.handleOut;
        const hIn = s1.handleIn;
        const isLine = Math.hypot(hOut.x, hOut.y) < 1e-4 && Math.hypot(hIn.x, hIn.y) < 1e-4;
        if (isLine) {
          if (Math.hypot(s1.point.x - s0.point.x, s1.point.y - s0.point.y) > 1e-4) {
            sp.push({ type: 'L', x: s1.point.x, y: -s1.point.y });
          }
        } else {
          sp.push({
            type: 'C',
            x1: s0.point.x + hOut.x, y1: -(s0.point.y + hOut.y),
            x2: s1.point.x + hIn.x, y2: -(s1.point.y + hIn.y),
            x: s1.point.x, y: -s1.point.y
          });
        }
      }
      sp.push({ type: 'Z' });
      out.push(sp);
    } else {
      out.push(raw[i].sp);
    }
  }
  return out;
}

/**
 * Rounded rectangle in Y-up coordinates with independent corner radii:
 * r = { tl, tr, br, bl } (each defaults to 0)
 */
function rrect(x, y, w, h, r = {}) {
  const tl = Math.min(r.tl || 0, w / 2, h / 2);
  const tr = Math.min(r.tr || 0, w / 2, h / 2);
  const br = Math.min(r.br || 0, w / 2, h / 2);
  const bl = Math.min(r.bl || 0, w / 2, h / 2);
  const x0 = x, x1 = x + w, y0 = y, y1 = y + h;
  const k = KAPPA;

  const sp = [];
  // Build CCW in Y-up: start bottom-left after bl, go right, up, left, down
  sp.push({ type: 'M', x: x0 + bl, y: y0 });
  if (x1 - br > x0 + bl) sp.push({ type: 'L', x: x1 - br, y: y0 });
  if (br > 0) sp.push({ type: 'C', x1: x1 - br * (1 - k), y1: y0, x2: x1, y2: y0 + br * (1 - k), x: x1, y: y0 + br });
  if (y1 - tr > y0 + br) sp.push({ type: 'L', x: x1, y: y1 - tr });
  if (tr > 0) sp.push({ type: 'C', x1: x1, y1: y1 - tr * (1 - k), x2: x1 - tr * (1 - k), y2: y1, x: x1 - tr, y: y1 });
  if (x0 + tl < x1 - tr) sp.push({ type: 'L', x: x0 + tl, y: y1 });
  if (tl > 0) sp.push({ type: 'C', x1: x0 + tl * (1 - k), y1: y1, x2: x0, y2: y1 - tl * (1 - k), x: x0, y: y1 - tl });
  if (y0 + bl < y1 - tl) sp.push({ type: 'L', x: x0, y: y0 + bl });
  if (bl > 0) sp.push({ type: 'C', x1: x0, y1: y0 + bl * (1 - k), x2: x0 + bl * (1 - k), y2: y0, x: x0 + bl, y: y0 });
  sp.push({ type: 'Z' });
  return subpathsToPaper([sp]);
}

/**
 * Signature asymmetric inner counter slit of TYPOGRAPHY101!
 * Large radius on top-left & bottom-right (~0.75 * w or rBig),
 * Tight radius on top-right & bottom-left (~0.14 * w or rSmall).
 * Matches the blue construction pill from TYPOGRAPHY101.ai!
 */
function asymSlit(x, y, w, h, rBig = null, rSmall = null) {
  const rb = rBig !== null ? rBig : Math.min(w * 0.78, h * 0.45);
  const rs = rSmall !== null ? rSmall : Math.min(w * 0.14, h * 0.2);
  return rrect(x, y, w, h, { tl: rb, tr: rs, br: rb, bl: rs });
}

/**
 * Polygon with per-vertex rounding in Y-up coordinates!
 * pts: array of [x, y, radius] (CCW or CW)
 */
function rpoly(pts) {
  const n = pts.length;
  const sp = [];
  const k = KAPPA;

  function segInfo(i) {
    const pPrev = pts[(i - 1 + n) % n];
    const p = pts[i];
    const pNext = pts[(i + 1) % n];
    const r = p[2] || 0;
    const v1x = pPrev[0] - p[0], v1y = pPrev[1] - p[1];
    const l1 = Math.hypot(v1x, v1y);
    const v2x = pNext[0] - p[0], v2y = pNext[1] - p[1];
    const l2 = Math.hypot(v2x, v2y);
    if (r <= 0.01 || l1 < 1e-4 || l2 < 1e-4) {
      return { inPt: [p[0], p[1]], outPt: [p[0], p[1]], corner: [p[0], p[1]], r: 0 };
    }
    const u1x = v1x / l1, u1y = v1y / l1;
    const u2x = v2x / l2, u2y = v2y / l2;
    // angle between u1 and u2
    const dot = Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y));
    const angle = Math.acos(dot);
    const tanHalf = Math.tan(angle / 2);
    let dist = tanHalf > 1e-4 ? r / tanHalf : r;
    const maxDist = Math.min(l1, l2) * 0.48;
    if (dist > maxDist) dist = maxDist;
    return {
      inPt: [p[0] + u1x * dist, p[1] + u1y * dist],
      outPt: [p[0] + u2x * dist, p[1] + u2y * dist],
      corner: [p[0], p[1]],
      r: dist * tanHalf,
      dist,
      angle
    };
  }

  const infos = [];
  for (let i = 0; i < n; i++) infos.push(segInfo(i));

  sp.push({ type: 'M', x: infos[0].inPt[0], y: infos[0].inPt[1] });
  for (let i = 0; i < n; i++) {
    const info = infos[i];
    if (info.r > 0.01) {
      // Cubic approximation of circular arc between inPt and outPt around corner
      const sweep = Math.PI - info.angle;
      const handleFactor = (4 / 3) * Math.tan(sweep / 4) / Math.tan(sweep / 2);
      const t = Math.min(0.85, Math.max(0.4, handleFactor));
      const c1x = info.inPt[0] + (info.corner[0] - info.inPt[0]) * t;
      const c1y = info.inPt[1] + (info.corner[1] - info.inPt[1]) * t;
      const c2x = info.outPt[0] + (info.corner[0] - info.outPt[0]) * t;
      const c2y = info.outPt[1] + (info.corner[1] - info.outPt[1]) * t;
      sp.push({ type: 'C', x1: c1x, y1: c1y, x2: c2x, y2: c2y, x: info.outPt[0], y: info.outPt[1] });
    }
    const next = infos[(i + 1) % n];
    if (Math.hypot(next.inPt[0] - info.outPt[0], next.inPt[1] - info.outPt[1]) > 0.05) {
      sp.push({ type: 'L', x: next.inPt[0], y: next.inPt[1] });
    }
  }
  sp.push({ type: 'Z' });
  return subpathsToPaper([sp]);
}

function circle(cx, cy, r) {
  return rrect(cx - r, cy - r, r * 2, r * 2, { tl: r, tr: r, br: r, bl: r });
}

function oval(cx, cy, rx, ry) {
  return rrect(cx - rx, cy - ry, rx * 2, ry * 2, { tl: Math.min(rx, ry), tr: Math.min(rx, ry), br: Math.min(rx, ry), bl: Math.min(rx, ry) });
}

/**
 * C1-tangent smooth vertical waist indentation cutter (zero kinks where it meets a vertical wall!).
 * side: 'left' (wall at edgeX, indents right to edgeX+depth) or 'right' (wall at edgeX, indents left to edgeX-depth)
 */
function smoothWaistCut(edgeX, midY, depth, halfSpan, side = 'right') {
  const dir = side === 'right' ? -1 : 1; // direction into the glyph
  const outX = edgeX - dir * 24;         // safe outside margin
  const inX = edgeX + dir * depth;
  const yTop = midY + halfSpan;
  const yBot = midY - halfSpan;
  const k = halfSpan * 0.52;
  const sp = [
    { type: 'M', x: outX, y: yTop },
    { type: 'L', x: edgeX, y: yTop },
    { type: 'C', x1: edgeX, y1: yTop - k, x2: inX, y2: midY + k, x: inX, y: midY },
    { type: 'C', x1: inX, y1: midY - k, x2: edgeX, y2: yBot + k, x: edgeX, y: yBot },
    { type: 'L', x: outX, y: yBot },
    { type: 'Z' }
  ];
  return subpathsToPaper([sp]);
}

function uniteAll(items) {
  const valid = items.filter(Boolean);
  if (valid.length === 0) return new scope.Path();
  let acc = valid[0].clone();
  for (let i = 1; i < valid.length; i++) {
    const next = acc.unite(valid[i]);
    acc.remove();
    acc = next;
  }
  return acc;
}

function subtractAll(base, cutters) {
  let acc = base.clone();
  for (const c of cutters) {
    if (!c) continue;
    const next = acc.subtract(c);
    acc.remove();
    acc = next;
  }
  return acc;
}

function intersect(a, b) {
  return a.intersect(b);
}

function translateSubpaths(subpaths, dx, dy) {
  return subpaths.map(sp => sp.map(cmd => {
    if (cmd.type === 'Z') return { type: 'Z' };
    if (cmd.type === 'C') {
      return {
        type: 'C',
        x1: cmd.x1 + dx, y1: cmd.y1 + dy,
        x2: cmd.x2 + dx, y2: cmd.y2 + dy,
        x: cmd.x + dx, y: cmd.y + dy
      };
    }
    return { type: cmd.type, x: cmd.x + dx, y: cmd.y + dy };
  }));
}

function scaleSubpaths(subpaths, sx, sy) {
  return subpaths.map(sp => sp.map(cmd => {
    if (cmd.type === 'Z') return { type: 'Z' };
    if (cmd.type === 'C') {
      return {
        type: 'C',
        x1: cmd.x1 * sx, y1: cmd.y1 * sy,
        x2: cmd.x2 * sx, y2: cmd.y2 * sy,
        x: cmd.x * sx, y: cmd.y * sy
      };
    }
    return { type: cmd.type, x: cmd.x * sx, y: cmd.y * sy };
  }));
}

function shearSubpaths(subpaths, tanAngle) {
  return subpaths.map(sp => sp.map(cmd => {
    if (cmd.type === 'Z') return { type: 'Z' };
    if (cmd.type === 'C') {
      return {
        type: 'C',
        x1: cmd.x1 + cmd.y1 * tanAngle, y1: cmd.y1,
        x2: cmd.x2 + cmd.y2 * tanAngle, y2: cmd.y2,
        x: cmd.x + cmd.y * tanAngle, y: cmd.y
      };
    }
    return { type: cmd.type, x: cmd.x + cmd.y * tanAngle, y: cmd.y };
  }));
}

function bboxOfSubpaths(subpaths) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sp of subpaths) {
    for (const cmd of sp) {
      for (const [px, py] of [[cmd.x, cmd.y], [cmd.x1, cmd.y1], [cmd.x2, cmd.y2]]) {
        if (px !== undefined) {
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }
    }
  }
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function subpathsToSvgD(subpaths, scale = 1, offsetX = 0, offsetY = 0) {
  return subpaths.map(sp => sp.map(cmd => {
    if (cmd.type === 'M') return `M ${(cmd.x * scale + offsetX).toFixed(2)} ${(-cmd.y * scale + offsetY).toFixed(2)}`;
    if (cmd.type === 'L') return `L ${(cmd.x * scale + offsetX).toFixed(2)} ${(-cmd.y * scale + offsetY).toFixed(2)}`;
    if (cmd.type === 'C') return `C ${(cmd.x1 * scale + offsetX).toFixed(2)} ${(-cmd.y1 * scale + offsetY).toFixed(2)} ${(cmd.x2 * scale + offsetX).toFixed(2)} ${(-cmd.y2 * scale + offsetY).toFixed(2)} ${(cmd.x * scale + offsetX).toFixed(2)} ${(-cmd.y * scale + offsetY).toFixed(2)}`;
    return 'Z';
  }).join(' ')).join(' ');
}

function cleanupScope() {
  scope.project.activeLayer.removeChildren();
}

module.exports = {
  scope,
  KAPPA,
  subpathsToPaper,
  paperToSubpaths,
  rrect,
  asymSlit,
  rpoly,
  circle,
  oval,
  smoothWaistCut,
  uniteAll,
  subtractAll,
  intersect,
  translateSubpaths,
  scaleSubpaths,
  shearSubpaths,
  bboxOfSubpaths,
  subpathsToSvgD,
  cleanupScope
};
