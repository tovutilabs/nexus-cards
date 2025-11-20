/// <reference types="node" />
import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  // TECH TEMPLATES
  {
    name: 'Modern Tech',
    slug: 'modern-tech',
    description: 'Clean, minimal design perfect for developers and tech professionals',
    category: 'tech',
    industry: ['technology', 'software', 'startup'],
    minTier: SubscriptionTier.FREE,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#3B82F6',
        secondary: '#1E293B',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#0F172A',
      },
      typography: {
        fontFamily: 'inter',
        headingWeight: '700',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'comfortable',
      borderRadius: 'lg',
      shadow: 'md',
    },
  },
  {
    name: 'Dark Mode Developer',
    slug: 'dark-mode-dev',
    description: 'Eye-friendly dark theme for developers and night owls',
    category: 'tech',
    industry: ['technology', 'software', 'gaming'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#EC4899',
        background: '#0F172A',
        text: '#F1F5F9',
      },
      typography: {
        fontFamily: 'mono',
        headingWeight: '600',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'comfortable',
      borderRadius: 'md',
      shadow: 'lg',
    },
  },
  {
    name: 'Startup Minimal',
    slug: 'startup-minimal',
    description: 'Ultra-minimal design for modern startups',
    category: 'tech',
    industry: ['startup', 'technology', 'venture'],
    minTier: SubscriptionTier.FREE,
    isActive: true,
    isFeatured: false,
    config: {
      colorScheme: {
        primary: '#000000',
        secondary: '#737373',
        accent: '#FF6B6B',
        background: '#FFFFFF',
        text: '#171717',
      },
      typography: {
        fontFamily: 'sans',
        headingWeight: '800',
        bodyWeight: '400',
      },
      layout: 'center',
      spacing: 'compact',
      borderRadius: 'none',
      shadow: 'none',
    },
  },

  // CORPORATE TEMPLATES
  {
    name: 'Executive Professional',
    slug: 'executive-professional',
    description: 'Sophisticated design for C-level executives and senior management',
    category: 'corporate',
    industry: ['finance', 'consulting', 'corporate'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#1E40AF',
        secondary: '#475569',
        accent: '#D97706',
        background: '#F8FAFC',
        text: '#0F172A',
      },
      typography: {
        fontFamily: 'serif',
        headingWeight: '700',
        bodyWeight: '400',
      },
      layout: 'horizontal',
      spacing: 'comfortable',
      borderRadius: 'sm',
      shadow: 'sm',
    },
  },
  {
    name: 'Corporate Blue',
    slug: 'corporate-blue',
    description: 'Traditional corporate styling with professional blue tones',
    category: 'corporate',
    industry: ['corporate', 'business', 'consulting'],
    minTier: SubscriptionTier.FREE,
    isActive: true,
    isFeatured: false,
    config: {
      colorScheme: {
        primary: '#2563EB',
        secondary: '#64748B',
        accent: '#0891B2',
        background: '#FFFFFF',
        text: '#1E293B',
      },
      typography: {
        fontFamily: 'sans',
        headingWeight: '600',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'spacious',
      borderRadius: 'md',
      shadow: 'md',
    },
  },
  {
    name: 'Finance Pro',
    slug: 'finance-pro',
    description: 'Professional design for finance and banking professionals',
    category: 'corporate',
    industry: ['finance', 'banking', 'investment'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: false,
    config: {
      colorScheme: {
        primary: '#0F766E',
        secondary: '#475569',
        accent: '#CA8A04',
        background: '#FAFAF9',
        text: '#1C1917',
      },
      typography: {
        fontFamily: 'serif',
        headingWeight: '700',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'comfortable',
      borderRadius: 'sm',
      shadow: 'lg',
    },
  },

  // CREATIVE TEMPLATES
  {
    name: 'Creative Bold',
    slug: 'creative-bold',
    description: 'Vibrant and bold design for creatives and artists',
    category: 'creative',
    industry: ['design', 'art', 'photography'],
    minTier: SubscriptionTier.FREE,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#EC4899',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFBEB',
        text: '#1F2937',
      },
      typography: {
        fontFamily: 'display',
        headingWeight: '800',
        bodyWeight: '400',
      },
      layout: 'image-first',
      spacing: 'comfortable',
      borderRadius: 'xl',
      shadow: 'xl',
    },
  },
  {
    name: 'Artist Portfolio',
    slug: 'artist-portfolio',
    description: 'Showcase-focused design for artists and photographers',
    category: 'creative',
    industry: ['art', 'photography', 'design'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#DC2626',
        secondary: '#171717',
        accent: '#FBBF24',
        background: '#FFFFFF',
        text: '#0A0A0A',
      },
      typography: {
        fontFamily: 'sans',
        headingWeight: '700',
        bodyWeight: '300',
      },
      layout: 'image-first',
      spacing: 'spacious',
      borderRadius: 'none',
      shadow: 'none',
    },
  },
  {
    name: 'Design Agency',
    slug: 'design-agency',
    description: 'Modern design for agencies and creative studios',
    category: 'creative',
    industry: ['design', 'agency', 'marketing'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: false,
    config: {
      colorScheme: {
        primary: '#7C3AED',
        secondary: '#4338CA',
        accent: '#14B8A6',
        background: '#FAFAFA',
        text: '#18181B',
      },
      typography: {
        fontFamily: 'display',
        headingWeight: '800',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'comfortable',
      borderRadius: '2xl',
      shadow: 'lg',
    },
  },

  // LEGAL TEMPLATES
  {
    name: 'Legal Professional',
    slug: 'legal-professional',
    description: 'Conservative, trustworthy design for legal professionals',
    category: 'legal',
    industry: ['legal', 'law', 'attorney'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#1F2937',
        secondary: '#6B7280',
        accent: '#92400E',
        background: '#F9FAFB',
        text: '#111827',
      },
      typography: {
        fontFamily: 'serif',
        headingWeight: '700',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'spacious',
      borderRadius: 'sm',
      shadow: 'sm',
    },
  },
  {
    name: 'Law Firm Classic',
    slug: 'law-firm-classic',
    description: 'Traditional design for established law firms',
    category: 'legal',
    industry: ['legal', 'law', 'corporate'],
    minTier: SubscriptionTier.FREE,
    isActive: true,
    isFeatured: false,
    config: {
      colorScheme: {
        primary: '#0F172A',
        secondary: '#475569',
        accent: '#B45309',
        background: '#FFFFFF',
        text: '#1E293B',
      },
      typography: {
        fontFamily: 'serif',
        headingWeight: '700',
        bodyWeight: '400',
      },
      layout: 'horizontal',
      spacing: 'comfortable',
      borderRadius: 'none',
      shadow: 'none',
    },
  },

  // HEALTHCARE TEMPLATES
  {
    name: 'Medical Professional',
    slug: 'medical-professional',
    description: 'Clean, trustworthy design for healthcare professionals',
    category: 'healthcare',
    industry: ['healthcare', 'medical', 'wellness'],
    minTier: SubscriptionTier.FREE,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#0891B2',
        secondary: '#0E7490',
        accent: '#059669',
        background: '#F0FDFA',
        text: '#134E4A',
      },
      typography: {
        fontFamily: 'sans',
        headingWeight: '600',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'comfortable',
      borderRadius: 'lg',
      shadow: 'md',
    },
  },
  {
    name: 'Wellness Coach',
    slug: 'wellness-coach',
    description: 'Calming, nature-inspired design for wellness professionals',
    category: 'healthcare',
    industry: ['wellness', 'coaching', 'healthcare'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#F59E0B',
        background: '#ECFDF5',
        text: '#064E3B',
      },
      typography: {
        fontFamily: 'sans',
        headingWeight: '600',
        bodyWeight: '400',
      },
      layout: 'center',
      spacing: 'spacious',
      borderRadius: 'xl',
      shadow: 'lg',
    },
  },
  {
    name: 'Healthcare Provider',
    slug: 'healthcare-provider',
    description: 'Professional design for clinics and healthcare facilities',
    category: 'healthcare',
    industry: ['healthcare', 'medical', 'hospital'],
    minTier: SubscriptionTier.PRO,
    isActive: true,
    isFeatured: false,
    config: {
      colorScheme: {
        primary: '#1E40AF',
        secondary: '#1E3A8A',
        accent: '#10B981',
        background: '#EFF6FF',
        text: '#1E3A8A',
      },
      typography: {
        fontFamily: 'sans',
        headingWeight: '700',
        bodyWeight: '400',
      },
      layout: 'vertical',
      spacing: 'comfortable',
      borderRadius: 'md',
      shadow: 'md',
    },
  },

  // PREMIUM EXCLUSIVE
  {
    name: 'Luxury Gold',
    slug: 'luxury-gold',
    description: 'Premium design with gold accents for luxury brands',
    category: 'creative',
    industry: ['luxury', 'premium', 'fashion'],
    minTier: SubscriptionTier.PREMIUM,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#000000',
        secondary: '#78350F',
        accent: '#F59E0B',
        background: '#FFFBEB',
        text: '#1C1917',
      },
      typography: {
        fontFamily: 'serif',
        headingWeight: '700',
        bodyWeight: '400',
      },
      layout: 'center',
      spacing: 'spacious',
      borderRadius: 'none',
      shadow: '2xl',
    },
  },
  {
    name: 'Elite Executive',
    slug: 'elite-executive',
    description: 'Ultra-premium design for top-tier executives',
    category: 'corporate',
    industry: ['executive', 'luxury', 'premium'],
    minTier: SubscriptionTier.PREMIUM,
    isActive: true,
    isFeatured: true,
    config: {
      colorScheme: {
        primary: '#0C4A6E',
        secondary: '#1E293B',
        accent: '#B45309',
        background: '#F8FAFC',
        text: '#0F172A',
      },
      typography: {
        fontFamily: 'serif',
        headingWeight: '800',
        bodyWeight: '400',
      },
      layout: 'horizontal',
      spacing: 'spacious',
      borderRadius: 'sm',
      shadow: 'xl',
    },
  },
];

async function seedTemplates() {
  console.log('Seeding card templates...');

  for (const template of templates) {
    await prisma.cardTemplate.upsert({
      where: { slug: template.slug },
      update: template,
      create: template,
    });
    console.log(`✓ Created/updated template: ${template.name}`);
  }

  console.log(`\nSeeded ${templates.length} templates successfully!`);
}

seedTemplates()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
