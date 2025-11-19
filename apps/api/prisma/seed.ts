import {
  PrismaClient,
  UserRole,
  SubscriptionTier,
  SubscriptionStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const env = process.env.NODE_ENV || 'development';
  console.log(`Running seed script for environment: ${env}`);

  // Only seed admin users in development
  if (env === 'development') {
    console.log('Seeding development users...');
    await seedDevelopmentUsers();
  } else {
    console.log('Skipping admin user seeding in production environment');
  }

  // Seed common data for all environments
  await seedCommonData();

  console.log('Seeding completed successfully');
}

async function seedDevelopmentUsers() {
  // Admin User
  const adminEmail = 'admin@nexus.cards';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminPassword = await argon2.hash('Admin123!');
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPassword,
        role: UserRole.ADMIN,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            timezone: 'UTC',
            language: 'en',
          },
        },
        subscription: {
          create: {
            tier: SubscriptionTier.PREMIUM,
            status: SubscriptionStatus.ACTIVE,
          },
        },
      },
    });
    console.log(`✓ Created ADMIN user: ${adminEmail} (password: Admin123!)`);
  } else {
    console.log(`- ADMIN user already exists: ${adminEmail}`);
  }

  // Regular User - FREE tier
  const freeUserEmail = 'user.free@example.com';
  const existingFreeUser = await prisma.user.findUnique({
    where: { email: freeUserEmail },
  });

  if (!existingFreeUser) {
    const freePassword = await argon2.hash('User123!');
    await prisma.user.create({
      data: {
        email: freeUserEmail,
        passwordHash: freePassword,
        role: UserRole.USER,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Free',
            lastName: 'User',
            company: 'Startup Inc',
            jobTitle: 'Developer',
            timezone: 'UTC',
            language: 'en',
          },
        },
        subscription: {
          create: {
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.ACTIVE,
          },
        },
      },
    });
    console.log(`✓ Created USER (FREE): ${freeUserEmail} (password: User123!)`);
  } else {
    console.log(`- USER (FREE) already exists: ${freeUserEmail}`);
  }

  // Regular User - PRO tier
  const proUserEmail = 'user.pro@example.com';
  const existingProUser = await prisma.user.findUnique({
    where: { email: proUserEmail },
  });

  if (!existingProUser) {
    const proPassword = await argon2.hash('User123!');
    await prisma.user.create({
      data: {
        email: proUserEmail,
        passwordHash: proPassword,
        role: UserRole.USER,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Pro',
            lastName: 'User',
            company: 'Tech Corp',
            jobTitle: 'Senior Developer',
            timezone: 'America/New_York',
            language: 'en',
          },
        },
        subscription: {
          create: {
            tier: SubscriptionTier.PRO,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
      },
    });
    console.log(`✓ Created USER (PRO): ${proUserEmail} (password: User123!)`);
  } else {
    console.log(`- USER (PRO) already exists: ${proUserEmail}`);
  }

  // Regular User - PREMIUM tier
  const premiumUserEmail = 'user.premium@example.com';
  const existingPremiumUser = await prisma.user.findUnique({
    where: { email: premiumUserEmail },
  });

  if (!existingPremiumUser) {
    const premiumPassword = await argon2.hash('User123!');
    await prisma.user.create({
      data: {
        email: premiumUserEmail,
        passwordHash: premiumPassword,
        role: UserRole.USER,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Premium',
            lastName: 'User',
            company: 'Enterprise Solutions',
            jobTitle: 'CTO',
            phone: '+1234567890',
            timezone: 'Europe/London',
            language: 'en',
          },
        },
        subscription: {
          create: {
            tier: SubscriptionTier.PREMIUM,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        },
      },
    });
    console.log(
      `✓ Created USER (PREMIUM): ${premiumUserEmail} (password: User123!)`
    );
  } else {
    console.log(`- USER (PREMIUM) already exists: ${premiumUserEmail}`);
  }
}

async function seedCommonData() {
  // Add any data that should be seeded in all environments
  console.log('Seeding common data...');
  // Future: Add default templates, system settings, etc.
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
