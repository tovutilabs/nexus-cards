import { PrismaClient, SubscriptionTier, ComponentType } from '@prisma/client';

const prisma = new PrismaClient();

interface TierRule {
  tier: SubscriptionTier;
  componentType: ComponentType;
  maxAllowed: number | null;
}

const TIER_COMPONENT_RULES: TierRule[] = [
  // FREE tier - 5 basic component types, max 3 total
  { tier: SubscriptionTier.FREE, componentType: ComponentType.PROFILE, maxAllowed: null },
  { tier: SubscriptionTier.FREE, componentType: ComponentType.ABOUT, maxAllowed: null },
  { tier: SubscriptionTier.FREE, componentType: ComponentType.CONTACT, maxAllowed: null },
  { tier: SubscriptionTier.FREE, componentType: ComponentType.SOCIAL_LINKS, maxAllowed: null },
  { tier: SubscriptionTier.FREE, componentType: ComponentType.CUSTOM_LINKS, maxAllowed: null },
  
  // PRO tier - all basic + 5 pro types, max 8 total
  { tier: SubscriptionTier.PRO, componentType: ComponentType.PROFILE, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.ABOUT, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.CONTACT, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.SOCIAL_LINKS, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.CUSTOM_LINKS, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.GALLERY, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.VIDEO, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.CALENDAR, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.TESTIMONIALS, maxAllowed: null },
  { tier: SubscriptionTier.PRO, componentType: ComponentType.SERVICES, maxAllowed: null },
  
  // PREMIUM tier - all component types, unlimited
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.PROFILE, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.ABOUT, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.CONTACT, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.SOCIAL_LINKS, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.CUSTOM_LINKS, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.GALLERY, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.VIDEO, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.CALENDAR, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.TESTIMONIALS, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.SERVICES, maxAllowed: null },
  { tier: SubscriptionTier.PREMIUM, componentType: ComponentType.FORM, maxAllowed: null },
];

const COMPONENT_COUNT_LIMITS = {
  [SubscriptionTier.FREE]: 3,
  [SubscriptionTier.PRO]: 8,
  [SubscriptionTier.PREMIUM]: 999,
};

async function seedTierComponentRules() {
  console.log('Seeding tier component rules...');

  for (const rule of TIER_COMPONENT_RULES) {
    await prisma.tierComponentRule.upsert({
      where: {
        tier_componentType: {
          tier: rule.tier,
          componentType: rule.componentType,
        },
      },
      update: {
        maxAllowed: rule.maxAllowed,
      },
      create: rule,
    });
  }

  console.log(`✓ Seeded ${TIER_COMPONENT_RULES.length} tier component rules`);
  console.log('\nComponent limits per tier:');
  console.log(`  FREE: ${COMPONENT_COUNT_LIMITS.FREE} components total`);
  console.log(`  PRO: ${COMPONENT_COUNT_LIMITS.PRO} components total`);
  console.log(`  PREMIUM: ${COMPONENT_COUNT_LIMITS.PREMIUM} components total (unlimited)`);
}

async function main() {
  try {
    await seedTierComponentRules();
    console.log('\n✓ Tier rules seed completed successfully');
  } catch (error) {
    console.error('Error seeding tier rules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
