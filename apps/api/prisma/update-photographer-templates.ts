import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

const photographerCustomCss = {
  warm: `
/* Curved wave divider for photographer template - Warm */
.card-container {
  position: relative;
  overflow: hidden;
}

.card-photo-section {
  position: relative;
  background: #FFFFFF;
  padding-bottom: 60%;
  z-index: 1;
}

.card-info-section {
  position: relative;
  background: #D4A574;
  padding: 2rem 1.5rem;
  min-height: 40%;
  z-index: 2;
}

.card-wave-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120px;
  z-index: 2;
  pointer-events: none;
}

.card-wave-divider svg {
  width: 100%;
  height: 100%;
  display: block;
}

.card-wave-divider path {
  fill: #D4A574;
}

.photographer-name-vertical {
  position: absolute;
  left: 1.5rem;
  bottom: 3rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #2C2C2C;
  z-index: 3;
}

.contact-info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #2C2C2C;
  font-size: 0.875rem;
}

.social-icons-row {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.social-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2C2C2C;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}
`.trim(),
  minimal: `
/* Curved wave divider for photographer template - Minimal */
.card-container {
  position: relative;
  overflow: hidden;
}

.card-photo-section {
  position: relative;
  background: #FFFFFF;
  padding-bottom: 60%;
  z-index: 1;
}

.card-info-section {
  position: relative;
  background: #E8E8E8;
  padding: 2rem 1.5rem;
  min-height: 40%;
  z-index: 2;
}

.card-wave-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120px;
  z-index: 2;
  pointer-events: none;
}

.card-wave-divider svg {
  width: 100%;
  height: 100%;
  display: block;
}

.card-wave-divider path {
  fill: #E8E8E8;
}

.photographer-name-vertical {
  position: absolute;
  left: 1.5rem;
  bottom: 3rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #2C2C2C;
  z-index: 3;
}

.contact-info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #2C2C2C;
  font-size: 0.875rem;
}

.social-icons-row {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.social-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2C2C2C;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}
`.trim(),
  rose: `
/* Curved wave divider for photographer template - Rose */
.card-container {
  position: relative;
  overflow: hidden;
}

.card-photo-section {
  position: relative;
  background: #FFFFFF;
  padding-bottom: 60%;
  z-index: 1;
}

.card-info-section {
  position: relative;
  background: #D4A593;
  padding: 2rem 1.5rem;
  min-height: 40%;
  z-index: 2;
}

.card-wave-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120px;
  z-index: 2;
  pointer-events: none;
}

.card-wave-divider svg {
  width: 100%;
  height: 100%;
  display: block;
}

.card-wave-divider path {
  fill: #D4A593;
}

.photographer-name-vertical {
  position: absolute;
  left: 1.5rem;
  bottom: 3rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #2C2C2C;
  z-index: 3;
}

.contact-info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #2C2C2C;
  font-size: 0.875rem;
}

.social-icons-row {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.social-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2C2C2C;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: rgba(255, 255, 255, 0.45);
  transform: translateY(-2px);
}
`.trim(),
};

async function updatePhotographerTemplates() {
  console.log('Updating photographer templates with custom CSS...');

  const templates = [
    {
      slug: 'photographer-warm',
      customCss: photographerCustomCss.warm,
      color: '#D4A574',
    },
    {
      slug: 'photographer-minimal',
      customCss: photographerCustomCss.minimal,
      color: '#E8E8E8',
    },
    {
      slug: 'photographer-rose',
      customCss: photographerCustomCss.rose,
      color: '#D4A593',
    },
  ];

  for (const template of templates) {
    const existing = await prisma.cardTemplate.findUnique({
      where: { slug: template.slug },
    });

    if (existing) {
      const updatedConfig = {
        ...(existing.config as any),
        customCss: template.customCss,
      };

      await prisma.cardTemplate.update({
        where: { slug: template.slug },
        data: {
          config: updatedConfig,
        },
      });

      console.log(`✓ Updated ${template.slug} with curved wave CSS (${template.color})`);
    } else {
      console.log(`✗ Template ${template.slug} not found`);
    }
  }

  console.log('\nUpdated photographer templates successfully!');
}

updatePhotographerTemplates()
  .catch((e) => {
    console.error('Error updating templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
