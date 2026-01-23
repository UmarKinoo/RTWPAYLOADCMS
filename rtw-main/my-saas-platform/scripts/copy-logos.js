// Script to copy government logos from Downloads to public/assets
// Run with: node scripts/copy-logos.js

const fs = require('fs');
const path = require('path');

const downloadsPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads');
const assetsPath = path.join(process.cwd(), 'public', 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
}

console.log('Looking for logo files in Downloads...\n');

// Read all SVG files from Downloads
const files = fs.readdirSync(downloadsPath).filter(file => file.endsWith('.svg'));

let copied = 0;

files.forEach(file => {
  const filePath = path.join(downloadsPath, file);
  let destName = null;

  // Match based on Arabic text in filename
  if (file.includes('الإعلام') || file.includes('تنظيم')) {
    destName = 'logo-media-authority.svg';
  } else if (file.includes('2030') || file.includes('رؤية')) {
    destName = 'logo-vision-2030.svg';
  } else if (file.includes('الأعمال') || file.includes('Business Center')) {
    destName = 'logo-saudi-business-center.svg';
  } else if (file.includes('التجارة') || file.includes('Commerce')) {
    destName = 'logo-commerce-ministry.svg';
  }

  if (destName) {
    const destPath = path.join(assetsPath, destName);
    fs.copyFileSync(filePath, destPath);
    console.log(`✅ Copied: ${file} → ${destName}`);
    copied++;
  }
});

if (copied === 0) {
  console.log('❌ No matching logo files found in Downloads.');
  console.log('Please ensure the SVG files are in your Downloads folder.');
} else {
  console.log(`\n✅ Successfully copied ${copied} logo file(s)!`);
}
