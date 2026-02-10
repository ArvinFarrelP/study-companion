const sharp = require('sharp');
const fs = require('fs').promises;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = 'assets/images/icon-source.png';

async function generateIcons() {
  try {
    await fs.mkdir('assets/images', { recursive: true });
    
    for (const size of sizes) {
      await sharp(sourceIcon)
        .resize(size, size)
        .toFile(`assets/images/icon-${size}x${size}.png`);
      
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();