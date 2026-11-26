const fs = require('fs');
const path = require('path');

const stream = fs.readFileSync('E:/Projects/typography101-font/scripts/page_7_stream.txt', 'utf8');

// Parse PDF path blocks: track fill color and CTM
const lines = stream.split(/\r?\n/);
let fillColor = [0, 0, 0];
let shapes = [];
let inGroup = false;
let ctm = [1, 0, 0, 1, 0, 0];
let currentSubpaths = [];
let curSubpath = null;
let curPt = [0, 0];

function transformPt(x, y, m) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line || line.startsWith('%')) continue;

  // Color
  const scn = line.match(/([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+scn$/);
  if (scn) {
    fillColor = [parseFloat(scn[1]), parseFloat(scn[2]), parseFloat(scn[3])];
    continue;
  }

  // Group start with cm
  const qcm = line.match(/^q\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+cm$/);
  if (qcm) {
    ctm = qcm.slice(1, 7).map(Number);
    currentSubpaths = [];
    curSubpath = null;
    continue;
  }

  // Rectangle outside q..Q
  const reM = line.match(/^([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+re$/);
  if (reM && !line.includes('W n')) {
    const [x, y, w, h] = reM.slice(1, 5).map(Number);
    if (Math.abs(w) < 5000) {
      currentSubpaths.push([
        { type: 'M', x, y },
        { type: 'L', x: x + w, y },
        { type: 'L', x: x + w, y: y + h },
        { type: 'L', x, y: y + h },
        { type: 'Z' }
      ]);
    }
    continue;
  }

  const mOp = line.match(/^([\d.-]+)\s+([\d.-]+)\s+m$/);
  if (mOp) {
    const [x, y] = transformPt(parseFloat(mOp[1]), parseFloat(mOp[2]), ctm);
    curSubpath = [{ type: 'M', x, y }];
    currentSubpaths.push(curSubpath);
    curPt = [x, y];
    continue;
  }

  const lOp = line.match(/^([\d.-]+)\s+([\d.-]+)\s+l$/);
  if (lOp && curSubpath) {
    const [x, y] = transformPt(parseFloat(lOp[1]), parseFloat(lOp[2]), ctm);
    curSubpath.push({ type: 'L', x, y });
    curPt = [x, y];
    continue;
  }

  const cOp = line.match(/^([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+c$/);
  if (cOp && curSubpath) {
    const [x1, y1] = transformPt(parseFloat(cOp[1]), parseFloat(cOp[2]), ctm);
    const [x2, y2] = transformPt(parseFloat(cOp[3]), parseFloat(cOp[4]), ctm);
    const [x, y] = transformPt(parseFloat(cOp[5]), parseFloat(cOp[6]), ctm);
    curSubpath.push({ type: 'C', x1, y1, x2, y2, x, y });
    curPt = [x, y];
    continue;
  }

  // PDF 'y' operator: x1 y1 x3 y3 y => cubic with cp1=(x1,y1), cp2=(x3,y3), end=(x3,y3)
  const yOp = line.match(/^([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+y$/);
  if (yOp && curSubpath) {
    const [x1, y1] = transformPt(parseFloat(yOp[1]), parseFloat(yOp[2]), ctm);
    const [x, y] = transformPt(parseFloat(yOp[3]), parseFloat(yOp[4]), ctm);
    curSubpath.push({ type: 'C', x1, y1, x2: x, y2: y, x, y });
    curPt = [x, y];
    continue;
  }

  // PDF 'v' operator: x2 y2 x3 y3 v => cubic with cp1=curPt, cp2=(x2,y2), end=(x3,y3)
  const vOp = line.match(/^([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+v$/);
  if (vOp && curSubpath) {
    const [x2, y2] = transformPt(parseFloat(vOp[1]), parseFloat(vOp[2]), ctm);
    const [x, y] = transformPt(parseFloat(vOp[3]), parseFloat(vOp[4]), ctm);
    curSubpath.push({ type: 'C', x1: curPt[0], y1: curPt[1], x2, y2, x, y });
    curPt = [x, y];
    continue;
  }

  if (line === 'h' && curSubpath) {
    curSubpath.push({ type: 'Z' });
    continue;
  }

  if (line === 'f' || line === 'f*') {
    if (currentSubpaths.length > 0) {
      // Ensure closed
      for (const sp of currentSubpaths) {
        if (sp[sp.length - 1].type !== 'Z') sp.push({ type: 'Z' });
      }
      // Compute bbox
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const sp of currentSubpaths) {
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
      shapes.push({
        idx: shapes.length,
        color: [...fillColor],
        bbox: { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY },
        subpaths: currentSubpaths
      });
    }
    currentSubpaths = [];
    curSubpath = null;
    ctm = [1, 0, 0, 1, 0, 0];
  }
}

// Sort black shapes in main alphabet row (y between 850 and 1300) by minX
const mainShapes = shapes
  .filter(s => s.color[0] === 0 && s.color[1] === 0 && s.color[2] === 0)
  .sort((a, b) => a.bbox.minX - b.bbox.minX);

console.log('Total shapes:', shapes.length, 'Black shapes:', mainShapes.length);
for (const s of mainShapes) {
  const b = s.bbox;
  console.log(
    `#${String(s.idx).padStart(2, '0')} x=[${b.minX.toFixed(1)}, ${b.maxX.toFixed(1)}] w=${b.w.toFixed(1)} ` +
    `y=[${b.minY.toFixed(1)}, ${b.maxY.toFixed(1)}] h=${b.h.toFixed(1)} sp=${s.subpaths.length}`
  );
}

fs.writeFileSync('E:/Projects/typography101-font/scripts/extracted_raw.json', JSON.stringify(shapes, null, 2));
