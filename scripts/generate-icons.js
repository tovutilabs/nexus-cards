#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../apps/web/public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon for Nexus Cards
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <g transform="translate(128, 128)">
    <!-- Card icon -->
    <rect x="0" y="80" width="256" height="160" rx="16" fill="white" opacity="0.95"/>
    <rect x="20" y="100" width="216" height="8" rx="4" fill="#4F46E5" opacity="0.3"/>
    <rect x="20" y="120" width="120" height="8" rx="4" fill="#4F46E5" opacity="0.3"/>
    <rect x="20" y="160" width="80" height="24" rx="12" fill="#4F46E5"/>
    <circle cx="200" cy="172" r="24" fill="#7C3AED" opacity="0.8"/>
    <path d="M 190 172 L 196 178 L 210 164" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">NEXUS</text>
</svg>
`;

const svgBuffer = Buffer.from(svgIcon);

async function generateIcons() {
  try {
    console.log('Generating PWA icons...');

    // Generate icon-512x512.png
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512x512.png'));
    console.log('✓ Generated icon-512x512.png');

    // Generate icon-192x192.png
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'));
    console.log('✓ Generated icon-192x192.png');

    // Generate icon-144x144.png
    await sharp(svgBuffer)
      .resize(144, 144)
      .png()
      .toFile(path.join(iconsDir, 'icon-144x144.png'));
    console.log('✓ Generated icon-144x144.png');

    // Generate apple-touch-icon.png (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');

    // Generate favicon.ico (32x32)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(iconsDir, 'favicon-32x32.png'));
    console.log('✓ Generated favicon-32x32.png');

    // Generate favicon (16x16)
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(iconsDir, 'favicon-16x16.png'));
    console.log('✓ Generated favicon-16x16.png');

    // Also place favicon in public root
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../apps/web/public/favicon.ico'));
    console.log('✓ Generated favicon.ico');

    console.log('\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
