#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexus_cards'
      }
    }
  });

  try {
    // Read the CSS file
    const cssPath = path.join(__dirname, '../apps/api/src/cards/styles/photographer-split.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    console.log(`Read CSS file (${cssContent.length} bytes)`);

    // Update the template
    const updated = await prisma.cardTemplate.update({
      where: { slug: 'photographer-split' },
      data: {
        config: {
          customCss: cssContent
        }
      }
    });

    console.log(`✓ Updated template: ${updated.name}`);
    console.log(`✓ CSS length: ${cssContent.length} bytes`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
