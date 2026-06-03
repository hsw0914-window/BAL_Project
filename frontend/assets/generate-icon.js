const sharp = require('sharp');
const path = require('path');

const svg = `<svg width="1024" height="1024" viewBox="-5 -5 60 60" xmlns="http://www.w3.org/2000/svg">
  <rect x="-5" y="-5" width="60" height="60" fill="#1B2D4F"/>
  <circle cx="22" cy="25" r="15" fill="#FFFDF6"/>
  <circle cx="31" cy="21" r="14" fill="#1B2D4F"/>
  <path d="M 40 11 L 41.2 14 L 44.2 15.2 L 41.2 16.4 L 40 19.4 L 38.8 16.4 L 35.8 15.2 L 38.8 14 Z" fill="#FFFDF6"/>
  <path d="M 37 36 L 37.8 38 L 39.8 38.8 L 37.8 39.6 L 37 41.6 L 36.2 39.6 L 34.2 38.8 L 36.2 38 Z" fill="#FFFDF6"/>
  <circle cx="45" cy="27" r="1" fill="#FFFDF6"/>
  <circle cx="33" cy="8" r="0.8" fill="#FFFDF6"/>
</svg>`;

sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile(path.join(__dirname, 'icon.png'))
  .then(() => console.log('icon.png 생성 완료!'))
  .catch(err => console.error(err));
