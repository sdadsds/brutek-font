const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('E:/Projects/typography101-font/source/TYPOGRAPHY101.pdf');
const str = buf.toString('latin1');

// Extract all objects
const objRegex = /(\d+)\s+(\d+)\s+obj\b([\s\S]*?)endobj/g;
const objs = new Map();
let m;
while ((m = objRegex.exec(str)) !== null) {
  const num = parseInt(m[1], 10);
  const body = m[3];
  objs.set(num, body);
}

console.log('Total objects:', objs.size);

// Find Page objects
for (const [num, body] of objs) {
  if (/\/Type\s*\/Page\b/.test(body) && !/\/Type\s*\/Pages\b/.test(body)) {
    console.log(`\n=== Page obj ${num} ===`);
    console.log(body.slice(0, 600));
  }
}

// Find OCG names
console.log('\n=== OCGs ===');
for (const [num, body] of objs) {
  if (/\/Type\s*\/OCG\b/.test(body)) {
    const nameM = body.match(/\/Name\s*\(([^)]*)\)/);
    console.log(`OCG ${num}: ${nameM ? nameM[1] : body.trim()}`);
  }
}

// Helper to decompress stream of an object
function getStream(objNum) {
  const body = objs.get(objNum);
  if (!body) return null;
  const sIdx = body.indexOf('stream');
  const eIdx = body.lastIndexOf('endstream');
  if (sIdx === -1 || eIdx === -1) return null;
  let start = sIdx + 6;
  if (body[start] === '\r' && body[start + 1] === '\n') start += 2;
  else if (body[start] === '\n' || body[start] === '\r') start += 1;
  const raw = Buffer.from(body.slice(start, eIdx), 'latin1');
  if (/\/FlateDecode/.test(body)) {
    try {
      return zlib.inflateSync(raw).toString('latin1');
    } catch (e) {
      return `ERROR inflating: ${e.message}`;
    }
  }
  return raw.toString('latin1');
}

// Dump streams for page Contents
for (const [num, body] of objs) {
  if (/\/Type\s*\/Page\b/.test(body) && !/\/Type\s*\/Pages\b/.test(body)) {
    const cMatch = body.match(/\/Contents\s+(\d+)\s+0\s+R/) || body.match(/\/Contents\s*\[([^\]]+)\]/);
    if (cMatch) {
      const refs = cMatch[1].match(/\d+/g);
      let fullStream = '';
      for (const r of refs) {
        const s = getStream(parseInt(r, 10));
        if (s) fullStream += `\n% --- obj ${r} ---\n` + s;
      }
      fs.writeFileSync(`E:/Projects/typography101-font/scripts/page_${num}_stream.txt`, fullStream);
      console.log(`Wrote page_${num}_stream.txt (${fullStream.length} bytes)`);
      console.log('Sample:\n', fullStream.slice(0, 1200));
    }
  }
}
