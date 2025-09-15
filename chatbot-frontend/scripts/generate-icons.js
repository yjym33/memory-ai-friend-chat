const fs = require("fs");
const path = require("path");

// 간단한 SVG 아이콘 생성
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${
  size * 0.2
}" fill="url(#gradient)"/>
  <circle cx="${size * 0.35}" cy="${size * 0.35}" r="${
  size * 0.08
}" fill="white"/>
  <circle cx="${size * 0.65}" cy="${size * 0.35}" r="${
  size * 0.08
}" fill="white"/>
  <path d="M ${size * 0.3} ${size * 0.6} Q ${size * 0.5} ${size * 0.75} ${
  size * 0.7
} ${size * 0.6}" stroke="white" stroke-width="${
  size * 0.03
}" fill="none" stroke-linecap="round"/>
</svg>
`;

// public 디렉토리 확인
const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 아이콘 파일들 생성
const iconSizes = [192, 512];

iconSizes.forEach((size) => {
  const svgContent = createIconSVG(size);
  const iconPath = path.join(publicDir, `icon-${size}x${size}.png`);

  // SVG를 파일로 저장 (실제 PNG 변환은 별도 도구 필요)
  const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);

  console.log(`Generated icon-${size}x${size}.svg`);
});

console.log("Icon generation completed!");
console.log(
  "Note: SVG files were created. For PNG conversion, you may need additional tools."
);

