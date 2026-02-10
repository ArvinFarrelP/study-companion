// GENERATOR ICON YANG OPTIMAL
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const optimalSizes = [
  // iOS Requirements
  { size: 120, purpose: 'apple-touch-icon' },
  { size: 152, purpose: 'apple-touch-icon iPad' },
  { size: 167, purpose: 'apple-touch-icon iPad Pro' },
  { size: 180, purpose: 'apple-touch-icon iPhone (WAJIB iOS)' },
  
  // Android/Chrome Requirements
  { size: 192, purpose: 'android-chrome WAJIB' },
  { size: 384, purpose: 'android-chrome-hd' },
  
  // Splash & Large
  { size: 512, purpose: 'splash-screen WAJIB' },
  
  // Other platforms
  { size: 72, purpose: 'old-android' },
  { size: 96, purpose: 'windows-taskbar' },
  { size: 128, purpose: 'windows-chromeos' },
  { size: 144, purpose: 'ie-tiles' },
  { size: 256, purpose: 'macos-retina' },
  { size: 270, purpose: 'windows-large-tile' }
];

const sourceIcon = 'assets/images/icon-source.png'; // Minimal 512x512

async function generateOptimalIcons() {
  try {
    // Check if source icon exists
    try {
      await fs.access(sourceIcon);
    } catch (error) {
      console.error('❌ Source icon not found:', sourceIcon);
      console.log('💡 Please create a 512x512 PNG icon at:', sourceIcon);
      console.log('\n🎨 Quick icon creation options:');
      console.log('1. Use Figma: https://www.figma.com');
      console.log('2. Use Canva: https://www.canva.com');
      console.log('3. Use simple text icon (will create automatically)...');
      
      // Create a simple fallback icon if none exists
      await createFallbackIcon();
    }
    
    await fs.mkdir('assets/images', { recursive: true });
    
    console.log('🎨 Generating PWA icons for Study Companion...\n');
    
    for (const { size, purpose } of optimalSizes) {
      try {
        // Generate PNG
        await sharp(sourceIcon)
          .resize(size, size, { fit: 'cover', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png({ quality: 100 })
          .toFile(`assets/images/icon-${size}x${size}.png`);
        
        // Generate WebP (optional, lebih kecil)
        await sharp(sourceIcon)
          .resize(size, size)
          .webp({ quality: 90 })
          .toFile(`assets/images/icon-${size}x${size}.webp`);
        
        console.log(`✅ ${size}x${size} - ${purpose}`);
        
      } catch (error) {
        console.log(`⚠️  Failed ${size}x${size}: ${error.message}`);
      }
    }
    
    // Generate favicon.ico (untuk browser tab)
    await generateFavicon();
    
    // Generate apple-touch-icon.png (iOS khusus)
    await generateAppleTouchIcon();
    
    // Generate mstile-150x150.png untuk Windows
    await generateMsTile();
    
    console.log('\n✨ All icons generated successfully!');
    console.log('\n📁 Files created:');
    console.log('- PNG: icon-[size]x[size].png (13 files)');
    console.log('- WebP: icon-[size]x[size].webp (13 files, optional)');
    console.log('- favicon.ico (multi-size ICO)');
    console.log('- apple-touch-icon.png (180x180, untuk iOS)');
    console.log('- mstile-150x150.png (untuk Windows)');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

async function createFallbackIcon() {
  console.log('🔄 Creating fallback icon...');
  
  // Create a simple study companion icon
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#gradient)"/>
      <circle cx="256" cy="200" r="80" fill="white" fill-opacity="0.9"/>
      <rect x="150" y="300" width="212" height="120" rx="20" fill="white" fill-opacity="0.9"/>
      <text x="256" y="370" text-anchor="middle" fill="#0c4a6e" font-family="Arial, sans-serif" font-size="48" font-weight="bold">SC</text>
      <text x="256" y="420" text-anchor="middle" fill="#0c4a6e" font-family="Arial, sans-serif" font-size="24">Study</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svgIcon))
    .png()
    .toFile(sourceIcon);
  
  console.log('✅ Created fallback icon at:', sourceIcon);
}

async function generateFavicon() {
  try {
    // favicon.ico dengan multiple sizes
    const faviconSizes = [16, 32, 48, 64];
    
    // Create each size
    const buffers = [];
    for (const size of faviconSizes) {
      const buffer = await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toBuffer();
      buffers.push({ input: buffer, size: { width: size, height: size } });
    }
    
    // Save as favicon.ico
    await sharp(sourceIcon)
      .resize(64, 64)
      .toFile('favicon.ico');
    
    // Also create PNG versions for modern browsers
    for (const size of faviconSizes) {
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(`assets/images/favicon-${size}x${size}.png`);
    }
    
    console.log('✅ favicon.ico generated (16,32,48,64) + PNG versions');
  } catch (error) {
    console.warn('⚠️  Could not generate favicon.ico:', error.message);
  }
}

async function generateAppleTouchIcon() {
  try {
    // iOS membutuhkan apple-touch-icon.png khusus di root
    await sharp(sourceIcon)
      .resize(180, 180)
      .png({ quality: 100 })
      .toFile('apple-touch-icon.png');
    
    console.log('✅ apple-touch-icon.png (180x180)');
  } catch (error) {
    console.warn('⚠️  Could not generate apple-touch-icon.png:', error.message);
  }
}

async function generateMsTile() {
  try {
    // Windows/Edge tile
    await sharp(sourceIcon)
      .resize(150, 150)
      .png({ quality: 100 })
      .toFile('assets/images/mstile-150x150.png');
    
    console.log('✅ mstile-150x150.png (Windows/Edge)');
  } catch (error) {
    console.warn('⚠️  Could not generate mstile:', error.message);
  }
}

// Create package.json jika belum ada
async function createPackageJson() {
  try {
    await fs.access('package.json');
  } catch {
    const packageJson = {
      name: "study-companion-pwa",
      version: "1.0.0",
      description: "Study Companion PWA - Anime Pomodoro Timer",
      scripts: {
        "generate-icons": "node generate-icons.js",
        "dev": "npx serve .",
        "build": "node generate-icons.js"
      },
      devDependencies: {
        "sharp": "^0.33.2"
      }
    };
    
    await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log('📦 Created package.json');
  }
}

// Jalankan generator
async function main() {
  await createPackageJson();
  await generateOptimalIcons();
  
  console.log('\n🚀 PWA Icon Generation Complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Copy all files to your web server');
  console.log('2. Add these tags to your HTML <head>:');
  console.log(`
    <!-- Favicons -->
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16x16.png">
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/icon-180x180.png">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#38bdf8">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  `);
}

main().catch(console.error);