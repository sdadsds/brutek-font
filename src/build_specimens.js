const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const { Resvg } = require('@resvg/resvg-js');

const DIST = 'E:/Projects/typography101-font/dist';
const SPECIMENS = 'E:/Projects/typography101-font/specimens';
const DEMO = 'E:/Projects/typography101-font/demo';
fs.mkdirSync(SPECIMENS, { recursive: true });
fs.mkdirSync(DEMO, { recursive: true });

function loadFont(filePath) {
  const buf = fs.readFileSync(filePath);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

const regOtf = loadFont(path.join(DIST, 'Typography101-Regular.otf'));
const itaOtf = loadFont(path.join(DIST, 'Typography101-Italic.otf'));
const regTtf = loadFont(path.join(DIST, 'Typography101-Regular.ttf'));
const itaTtf = loadFont(path.join(DIST, 'Typography101-Italic.ttf'));
const vnRegOtf = loadFont(path.join(DIST, 'Typography101VN-Regular.otf'));
const vnItaOtf = loadFont(path.join(DIST, 'Typography101VN-Italic.otf'));

const getName = f => (f.names.windows?.fullName?.en || f.names.macintosh?.fullName?.en || f.names.fullName?.en || 'Typography101');
console.log('Verified binary loads:');
console.log('  Regular OTF:', getName(regOtf), 'glyphs:', regOtf.glyphs.length);
console.log('  Italic  OTF:', getName(itaOtf), 'glyphs:', itaOtf.glyphs.length);
console.log('  VN Reg  OTF:', getName(vnRegOtf), 'glyphs:', vnRegOtf.glyphs.length);
console.log('  VN Ita  OTF:', getName(vnItaOtf), 'glyphs:', vnItaOtf.glyphs.length);

function fmt(n) {
  return Number(n).toFixed(2).replace(/\.00$/, '');
}
function commandsToSvgD(commands) {
  let d = '';
  for (const c of commands) {
    if (c.type === 'M') d += `M${fmt(c.x)} ${fmt(c.y)}`;
    else if (c.type === 'L') d += `L${fmt(c.x)} ${fmt(c.y)}`;
    else if (c.type === 'C') d += `C${fmt(c.x1)} ${fmt(c.y1)} ${fmt(c.x2)} ${fmt(c.y2)} ${fmt(c.x)} ${fmt(c.y)}`;
    else if (c.type === 'Q') d += `Q${fmt(c.x1)} ${fmt(c.y1)} ${fmt(c.x)} ${fmt(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}

function renderTextPath(font, text, x, y, fontSize, fill = '#0a0a0a', kerning = true) {
  const p = font.getPath(text, x, y, fontSize, { kerning });
  const d = commandsToSvgD(p.commands);
  return `<path d="${d}" fill="${fill}" fill-rule="nonzero"/>`;
}

// 1. Flagship Specimen Poster
function buildFlagshipPoster() {
  const W = 2400, H = 1650;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<defs><clipPath id="sidebarClip"><rect x="48" y="48" width="520" height="1554"/></clipPath></defs>`;
  svg += `<rect width="${W}" height="${H}" fill="#ffffff"/>`;
  svg += `<path d="M 48 48 L 2160 48 Q 2352 48 2352 240 L 2352 1410 Q 2352 1602 2160 1602 L 48 1602 Z" fill="#ffffff" stroke="#0a0a0a" stroke-width="5"/>`;
  svg += `<rect x="48" y="48" width="520" height="1554" fill="#0a0a0a"/>`;
  svg += `<g clip-path="url(#sidebarClip)">`;
  svg += renderTextPath(regOtf, '\uE000', 48, 1340, 1280, '#1f1f1f', false);
  svg += `</g>`;
  svg += renderTextPath(regOtf, 'TYPE', 102, 240, 128, '#ffffff');
  svg += renderTextPath(regOtf, '101', 102, 370, 128, '#ffffff');
  svg += `<text x="104" y="435" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="#a1a1aa">COMPLETE TYPEFACE SET</text>`;
  svg += `<text x="104" y="1485" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#a1a1aa">OTF • TTF • WOFF2 • SVG</text>`;
  svg += `<text x="104" y="1520" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#a1a1aa">REGULAR + 20° ITALIC + VN</text>`;
  svg += `<text x="104" y="1555" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#71717a">${regOtf.glyphs.length} GLYPHS • LATIN + VIETNAMESE</text>`;

  const rx = 640;
  svg += `<text x="${rx}" y="110" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3" fill="#64748b">SET 1 — CAPITALIZATIONS (A–Z) • REGULAR</text>`;
  svg += renderTextPath(regOtf, 'ABCDEFGHIJKLM', rx, 224, 118, '#0a0a0a');
  svg += renderTextPath(regOtf, 'NOPQRSTUVWXYZ', rx, 344, 118, '#0a0a0a');

  svg += `<text x="${rx}" y="422" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3" fill="#64748b">SET 2 — ORIGINAL LOWERCASE (a–z) • REGULAR</text>`;
  svg += renderTextPath(regOtf, 'abcdefghijklmnop', rx, 514, 110, '#0a0a0a');
  svg += renderTextPath(regOtf, 'qrstuvwxyz', rx, 616, 110, '#0a0a0a');

  svg += `<text x="${rx}" y="696" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3" fill="#64748b">SET 3 — NUMBERS &amp; SYMBOLS (0–9)</text>`;
  svg += renderTextPath(regOtf, '0123456789  $€£¥₫%&@#*?!', rx, 804, 102, '#0a0a0a');

  svg += `<text x="${rx}" y="886" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3" fill="#64748b">SET 4 — SPECIAL LETTERS &amp; VIETNAMESE</text>`;
  svg += renderTextPath(regOtf, 'ĐĂÂÊÔƠƯ ÆŒØÞß  ẤẰỂỖỰ', rx, 1002, 84, '#0a0a0a');
  svg += renderTextPath(regOtf, 'đăâêôơư æœøþł  ấằểỗựỵ', rx, 1104, 84, '#0a0a0a');

  svg += `<line x1="${rx}" y1="1152" x2="2260" y2="1152" stroke="#e2e8f0" stroke-width="2"/>`;

  svg += `<text x="${rx}" y="1202" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="3" fill="#64748b">20° ITALIC &amp; VIETNAMESE KEYBOARD SPECIMEN</text>`;
  svg += renderTextPath(itaOtf, 'Typography 101 — 2026!', rx, 1326, 116, '#0a0a0a');
  svg += renderTextPath(vnItaOtf, 'Tiếng Việt thật đẹp — Phở Hà Nội 45.000₫', rx, 1456, 72, '#0a0a0a');
  svg += renderTextPath(regTtf, 'TTF Verified: Café Crème • Übergröße • Sài Gòn', rx, 1554, 62, '#334155');

  svg += `</svg>`;
  fs.writeFileSync(path.join(SPECIMENS, 'typography101-specimen-poster.svg'), svg);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 2000 } }).render().asPng();
  fs.writeFileSync(path.join(SPECIMENS, 'typography101-specimen-poster.png'), png);
  console.log('Rendered specimens/typography101-specimen-poster.png');
}

// 2. Dedicated Vietnamese Specimen Poster (auditing EVERY vowel x tone in Regular & 20° Italic!)
function buildVietnameseSpecimen() {
  const W = 2200, H = 1850;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#ffffff"/>`;
  svg += `<rect x="44" y="44" width="${W - 88}" height="${H - 88}" rx="42" fill="#ffffff" stroke="#0a0a0a" stroke-width="4"/>`;
  svg += `<text x="96" y="114" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="#64748b">TYPOGRAPHY101 VN — VIETNAMESE KEYBOARD COMPLETE SPECIMEN (TELEX / VNI)</text>`;

  // Hero display lines
  svg += renderTextPath(vnRegOtf, 'TIẾNG VIỆT — TYPOGRAPHY 101 VN', 96, 236, 102, '#0a0a0a');
  svg += renderTextPath(vnItaOtf, 'Ăn quả nhớ kẻ trồng cây • Sài Gòn 2026!', 96, 354, 86, '#0a0a0a');
  svg += renderTextPath(vnRegOtf, 'Phở bò tái nạm 55.000₫ • Bánh mì & Cà phê sữa đá', 96, 462, 68, '#1e293b');
  svg += `<line x1="96" y1="506" x2="${W - 96}" y2="506" stroke="#e2e8f0" stroke-width="2"/>`;

  // Complete 12-vowel x 6-tone chart (Upper + Lower) + Đ/đ/₫
  const rows = [
    ['Đ đ ₫', 'A À Á Ả Ã Ạ   a à á ả ã ạ'],
    ['Ă ă',   'Ă Ằ Ắ Ẳ Ẵ Ặ   ă ằ ắ ẳ ẵ ặ'],
    ['Â â',   'Â Ầ Ấ Ẩ Ẫ Ậ   â ầ ấ ẩ ẫ ậ'],
    ['E e',   'E È É Ẻ Ẽ Ẹ   e è é ẻ ẽ ẹ'],
    ['Ê ê',   'Ê Ề Ế Ể Ễ Ệ   ê ề ế ể ễ ệ'],
    ['I i',   'I Ì Í Ỉ Ĩ Ị   i ì í ỉ ĩ ị'],
    ['O o',   'O Ò Ó Ỏ Õ Ọ   o ò ó ỏ õ ọ'],
    ['Ô ô',   'Ô Ồ Ố Ổ Ỗ Ộ   ô ồ ố ổ ỗ ộ'],
    ['Ơ ơ',   'Ơ Ờ Ớ Ở Ỡ Ợ   ơ ờ ớ ở ỡ ợ'],
    ['U u',   'U Ù Ú Ủ Ũ Ụ   u ù ú ủ ũ ụ'],
    ['Ư ư',   'Ư Ừ Ứ Ử Ữ Ự   ư ừ ứ ử ữ ự'],
    ['Y y',   'Y Ỳ Ý Ỷ Ỹ Ỵ   y ỳ ý ỷ ỹ ỵ'],
  ];

  // Top special consonant row: Đ đ ₫
  svg += `<text x="96" y="558" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="#64748b">COMPLETE VIETNAMESE DIACRITIC MATRIX (6 TONES × 12 VOWELS + Đ/đ/₫)</text>`;

  rows.forEach(([tag, line], idx) => {
    const col = idx < 6 ? 0 : 1;
    const row = idx % 6;
    const x = col === 0 ? 96 : 1150;
    const y = 668 + row * 184;
    svg += `<line x1="${x}" y1="${y}" x2="${x + 950}" y2="${y}" stroke="#fee2e2" stroke-width="1"/>`;
    if (idx === 0) {
      svg += renderTextPath(vnRegOtf, 'Đ đ ₫', x, y, 64, '#dc2626');
      svg += renderTextPath(vnRegOtf, 'A À Á Ả Ã Ạ  a à á ả ã ạ', x + 210, y, 60, '#0a0a0a');
    } else {
      svg += renderTextPath(vnRegOtf, line, x, y, 68, '#0a0a0a');
    }
  });

  // Bottom 20° Italic Vietnamese test
  svg += `<line x1="96" y1="1668" x2="${W - 96}" y2="1668" stroke="#e2e8f0" stroke-width="2"/>`;
  svg += renderTextPath(vnItaOtf, 'Độc lập – Tự do – Hạnh phúc • Việt Nam 100%', 96, 1762, 76, '#0a0a0a');

  svg += `</svg>`;
  fs.writeFileSync(path.join(SPECIMENS, 'typography101-vietnamese-specimen.svg'), svg);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 2000 } }).render().asPng();
  fs.writeFileSync(path.join(SPECIMENS, 'typography101-vietnamese-specimen.png'), png);
  console.log('Rendered specimens/typography101-vietnamese-specimen.png');
}

// 3. Binary Verification Proof (OTF vs TTF, Regular vs Italic, EN + VN)
function buildBinaryVerificationProof() {
  const W = 2100, H = 980;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  svg += `<rect width="${W}" height="${H}" fill="#ffffff"/>`;
  svg += `<text x="50" y="58" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#0f172a">BINARY FONT RENDER VERIFICATION (OTF vs TTF • REGULAR vs 20° ITALIC • VN)</text>`;

  const rows = [
    { label: 'Regular OTF', font: regOtf, text: 'TYPOGRAPHY 101 — Abcdefg 0123456789 & @#?!' },
    { label: 'Regular TTF', font: regTtf, text: 'TYPOGRAPHY 101 — Abcdefg 0123456789 & @#?!' },
    { label: 'Italic  OTF', font: itaOtf, text: 'TYPOGRAPHY 101 — Abcdefg 0123456789 & @#?!' },
    { label: 'Italic  TTF', font: itaTtf, text: 'TYPOGRAPHY 101 — Abcdefg 0123456789 & @#?!' },
    { label: 'VN Reg  OTF', font: vnRegOtf, text: 'Tiếng Việt thật đẹp — Phở Hà Nội 55.000₫ • Ăn quả nhớ kẻ trồng cây' },
    { label: 'VN Ita  OTF', font: vnItaOtf, text: 'Độc lập – Tự do – Hạnh phúc • Sài Gòn & Đà Nẵng 2026!' },
  ];

  rows.forEach((r, idx) => {
    const y = 170 + idx * 135;
    svg += `<text x="50" y="${y - 68}" font-family="Consolas, monospace" font-size="18" fill="#64748b">${r.label}</text>`;
    svg += `<line x1="50" y1="${y}" x2="${W - 50}" y2="${y}" stroke="#fee2e2" stroke-width="1"/>`;
    svg += renderTextPath(r.font, r.text, 50, y, idx >= 4 ? 58 : 72, '#0a0a0a');
  });

  svg += `</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1900 } }).render().asPng();
  fs.writeFileSync(path.join(SPECIMENS, 'binary-verification.png'), png);
  console.log('Rendered specimens/binary-verification.png');
}

// 4. Interactive HTML Type Tester (with English + Vietnamese Keyboard Presets!)
function buildHtmlDemo() {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Typography101 &amp; Typography101 VN — Live Type Tester</title>
<style>
  @font-face {
    font-family: 'Typography101 VN';
    src: url('../dist/Typography101VN-Regular.woff2') format('woff2'),
         url('../dist/Typography101VN-Regular.otf') format('opentype'),
         url('../dist/Typography101VN-Regular.ttf') format('truetype');
    font-weight: 800;
    font-style: normal;
  }
  @font-face {
    font-family: 'Typography101 VN';
    src: url('../dist/Typography101VN-Italic.woff2') format('woff2'),
         url('../dist/Typography101VN-Italic.otf') format('opentype'),
         url('../dist/Typography101VN-Italic.ttf') format('truetype');
    font-weight: 800;
    font-style: italic;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 36px; font-family: system-ui, -apple-system, sans-serif;
    background: #0a0a0a; color: #f8fafc;
  }
  .wrap { max-width: 1200px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
  h1 { font-family: 'Typography101 VN', sans-serif; font-size: 56px; margin: 0; letter-spacing: 1px; }
  .badge { font-size: 13px; color: #a1a1aa; background: #18181b; border: 1px solid #27272a; padding: 6px 12px; border-radius: 999px; }
  .controls { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin-bottom: 20px; background: #18181b; padding: 14px 18px; border-radius: 12px; border: 1px solid #27272a; }
  label { font-size: 13px; color: #a1a1aa; display: flex; align-items: center; gap: 8px; }
  button { background: #27272a; color: #fff; border: 1px solid #3f3f46; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }
  button.active { background: #fff; color: #0a0a0a; }
  textarea {
    width: 100%; min-height: 240px; padding: 28px; border-radius: 16px;
    background: #ffffff; color: #0a0a0a; border: none; outline: none;
    font-family: 'Typography101 VN', sans-serif; font-size: 68px; line-height: 1.3;
    resize: vertical;
  }
  .sets { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-top: 32px; }
  .card { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 20px; }
  .card h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #a1a1aa; margin: 0 0 14px; }
  .glyphs { font-family: 'Typography101 VN', sans-serif; font-size: 42px; line-height: 1.45; word-break: break-word; color: #ffffff; }
  .italic { font-style: italic; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1>TYPOGRAPHY 101 VN</h1>
      <div style="color:#a1a1aa;margin-top:6px;">Complete Typeable Font Family — Original Lowercase + Capitals + Numbers + Extended Latin + Full Vietnamese (Telex/VNI)</div>
    </div>
    <span class="badge">OTF • TTF • WOFF2 • Regular &amp; 20° Italic</span>
  </header>

  <div class="controls">
    <button id="btnReg" class="active" onclick="setStyle('normal')">Regular</button>
    <button id="btnIta" onclick="setStyle('italic')">20° Italic</button>
    <button onclick="setPreset('en')">English Preset</button>
    <button onclick="setPreset('vn')">Tiếng Việt Preset</button>
    <label>Size <input id="size" type="range" min="24" max="140" value="68" oninput="update()" /> <span id="sizeVal">68px</span></label>
    <label>Tracking <input id="track" type="range" min="-4" max="16" value="0" oninput="update()" /> <span id="trackVal">0px</span></label>
    <button onclick="invertTheme()">Light / Dark</button>
  </div>

  <textarea id="editor" spellcheck="false">TYPOGRAPHY 101 — 2026!
Tiếng Việt thật đẹp • Phở Hà Nội &amp; Sài Gòn 55.000₫
Ăn quả nhớ kẻ trồng cây • Độc lập – Tự do – Hạnh phúc</textarea>

  <div class="sets">
    <div class="card">
      <h2>Set 1 — Original Lowercase (a–z)</h2>
      <div class="glyphs">abcdefghijklmnopqrstuvwxyz</div>
    </div>
    <div class="card">
      <h2>Set 2 — Capitalizations (A–Z)</h2>
      <div class="glyphs">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
    </div>
    <div class="card">
      <h2>Set 3 — Numbers (0–9)</h2>
      <div class="glyphs">0123456789</div>
    </div>
    <div class="card">
      <h2>Set 4 — Vietnamese Keyboard (Telex / VNI)</h2>
      <div class="glyphs">Đ đ ₫ Ă Ằ Ắ Ẳ Ẵ Ặ Â Ầ Ấ Ẩ Ẫ Ậ Ê Ề Ế Ể Ễ Ệ Ô Ồ Ố Ổ Ỗ Ộ Ơ Ờ Ớ Ở Ỡ Ợ Ư Ừ Ứ Ử Ữ Ự Ỳ Ý Ỷ Ỹ Ỵ ă ằ ắ ẳ ẵ ặ â ầ ấ ẩ ẫ ậ ê ề ế ể ễ ệ ô ồ ố ổ ỗ ộ ơ ờ ớ ở ỡ ợ ư ừ ứ ử ữ ự ỳ ý ỷ ỹ ỵ</div>
    </div>
    <div class="card">
      <h2>Set 5 — Special Letters &amp; Symbols</h2>
      <div class="glyphs">ß Æ æ Œ œ Ø ø Ð ð Þ þ Ł ł .,:;!?¡¿'"-–—_/\\|()[]{}&lt;&gt;+=×÷*#@&amp;%$€£¥₫¢°§©®™…·•</div>
    </div>
    <div class="card">
      <h2>20° Italic Preview (EN + VN)</h2>
      <div class="glyphs italic">Typography 101 • Tiếng Việt 2026! 0123456789 &amp; 55.000₫</div>
    </div>
  </div>
</div>
<script>
  const ed = document.getElementById('editor');
  let dark = false;
  function setStyle(s) {
    ed.style.fontStyle = s;
    document.getElementById('btnReg').classList.toggle('active', s === 'normal');
    document.getElementById('btnIta').classList.toggle('active', s === 'italic');
  }
  function setPreset(lang) {
    if (lang === 'vn') {
      ed.value = 'TIẾNG VIỆT — TYPOGRAPHY 101 VN\\nPhở bò tái nạm 55.000₫ • Bánh mì & Cà phê sữa đá\\nĂn quả nhớ kẻ trồng cây • Độc lập – Tự do – Hạnh phúc';
    } else {
      ed.value = 'TYPOGRAPHY 101 — 2026!\\nThe quick brown fox jumps over 123 lazy dogs.\\nCafé Crème • Übergröße • Æther Œuvre Øresund $49.99';
    }
  }
  function update() {
    const sz = document.getElementById('size').value;
    const tr = document.getElementById('track').value;
    ed.style.fontSize = sz + 'px';
    ed.style.letterSpacing = tr + 'px';
    document.getElementById('sizeVal').textContent = sz + 'px';
    document.getElementById('trackVal').textContent = tr + 'px';
  }
  function invertTheme() {
    dark = !dark;
    ed.style.background = dark ? '#18181b' : '#ffffff';
    ed.style.color = dark ? '#ffffff' : '#0a0a0a';
  }
</script>
</body>
</html>`;
  fs.writeFileSync(path.join(DEMO, 'index.html'), html, 'utf8');
  console.log('Created demo/index.html');
}

buildFlagshipPoster();
buildVietnameseSpecimen();
buildBinaryVerificationProof();
buildHtmlDemo();
