const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('E:/Projects/typography101-font/source/TYPOGRAPHY101.pdf');
const str = buf.toString('latin1');

const pages = str.match(/\/Type\s*\/Page\b/g) || [];
const mediaBoxes = str.match(/\/MediaBox\s*\[[^\]]+\]/g) || [];
const ocgs = str.match(/\/Type\s*\/OCG[\s\S]*?>>/g) || [];

console.log('Pages:', pages.length);
console.log('MediaBoxes:', [...new Set(mediaBoxes)]);
console.log('OCGs count:', ocgs.length);
ocgs.forEach((o, i) => console.log(`OCG ${i}:`, o.replace(/\s+/g, ' ')));
