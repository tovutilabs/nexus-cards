/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication Extensions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let twoFactorSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.oAuthProvider.deleteMany();
    await prisma.card.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Email Verification Flow', () => {
    let verificationToken: string;

    it('should register user with unverified email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'emailtest@example.com',
          password: 'SecurePassword123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.emailVerified).toBe(false);
      userId = response.body.user.id;
    });

    it('should send verification email and return token', async () => {
      // Get auth token from cookie
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'emailtest@example.com',
          password: 'SecurePassword123!',
        })
        .expect(200);

      const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
      authToken = cookies
        .find((cookie: string) => cookie.startsWith('access_token='))
        ?.split(';')[0]
        .split('=')[1] || '';

      const response = await request(app.getHttpServer())
        .post('/auth/email/send-verification')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      verificationToken = response.body.token;
    });

    it('should verify email with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/email/verify')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');

      // Check database
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.emailVerified).toBe(true);
      expect(user?.emailVerificationToken).toBeNull();
    });

    it('should reject invalid verification token', async () => {
      await request(app.getHttpServer())
        .post('/auth/email/verify')
        .send({ token: 'invalid-token-123' })
        .expect(400);
    });

    it('should get verification status', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/email/status')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.isVerified).toBe(true);
    });
  });

  describe('Two-Factor Authentication Flow', () => {
    let backupCodes: string[];

    beforeAll(async () => {
      // Create new user for 2FA tests
      await prisma.user.deleteMany({ where: { email: '2fatest@example.com' } });

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: '2fatest@example.com',
          password: 'SecurePassword123!',
        })
        .expect(201);

      userId = registerResponse.body.user.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: '2fatest@example.com',
          password: 'SecurePassword123!',
        })
        .expect(200);

      const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
      authToken = cookies
        .find((cookie: string) => cookie.startsWith('access_token='))
        ?.split(';')[0]
        .split('=')[1] || '';
    });

    it('should setup 2FA and get secret with QR code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/2fa/setup')
        .set('Cookie', `access_token=${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCodeUrl');
      expect(response.body.qrCodeUrl).toContain('otpauth://totp/');
      
      twoFactorSecret = response.body.secret;
    });

    it('should enable 2FA with valid TOTP code', async () => {
      const token = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/2fa/enable')
        .set('Cookie', `access_token=${authToken}`)
        .send({
          secret: twoFactorSecret,
          code: token,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.backupCodes).toHaveLength(8);
      backupCodes = response.body.backupCodes;

      // Verify database
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.twoFactorEnabled).toBe(true);
      expect(user?.twoFactorSecret).toBe(twoFactorSecret);
    });

    it('should reject login without 2FA code when enabled', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: '2fatest@example.com',
          password: 'SecurePassword123!',
        })
        .expect(200);

      expect(response.body.requires2FA).toBe(true);
      expect(response.body).not.toHaveProperty('user');
    });

    it('should allow login with valid 2FA code', async () => {
      const token = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login/2fa')
        .send({
          email: '2fatest@example.com',
          password: 'SecurePassword123!',
          twoFactorCode: token,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('2fatest@example.com');
    });

    it('should allow login with valid backup code', async () => {
      const backupCode = backupCodes[0];

      const response = await request(app.getHttpServer())
        .post('/auth/login/2fa')
        .send({
          email: '2fatest@example.com',
          password: 'SecurePassword123!',
          twoFactorCode: backupCode,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');

      // Backup code should be consumed
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { backupCodes: true },
      });
      expect(user?.backupCodes.length).toBe(7);
    });

    it('should reject used backup code', async () => {
      const usedBackupCode = backupCodes[0];

      await request(app.getHttpServer())
        .post('/auth/login/2fa')
        .send({
          email: '2fatest@example.com',
          password: 'SecurePassword123!',
          twoFactorCode: usedBackupCode,
        })
        .expect(401);
    });

    it('should regenerate backup codes', async () => {
      const token = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/2fa/regenerate-backup-codes')
        .set('Cookie', `access_token=${authToken}`)
        .send({ code: token })
        .expect(200);

      expect(response.body.backupCodes).toHaveLength(8);
      expect(response.body.backupCodes[0]).not.toBe(backupCodes[0]);
    });

    it('should disable 2FA with valid code', async () => {
      const token = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/2fa/disable')
        .set('Cookie', `access_token=${authToken}`)
        .send({ code: token })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify database
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.twoFactorEnabled).toBe(false);
      expect(user?.twoFactorSecret).toBeNull();
      expect(user?.backupCodes).toEqual([]);
    });
  });

  describe('Password Reset Flow', () => {
    let resetToken: string;

    beforeAll(async () => {
      // Create user for password reset tests
      await prisma.user.deleteMany({ where: { email: 'resettest@example.com' } });

      const passwordHash = await argon2.hash('OldPassword123!');
      const user = await prisma.user.create({
        data: {
          email: 'resettest@example.com',
          passwordHash,
          emailVerified: true,
          subscription: {
            create: {
              tier: 'FREE',
              status: 'ACTIVE',
            },
          },
        },
      });
      userId = user.id;
    });

    it('should request password reset and generate token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'resettest@example.com' })
        .expect(200);

      expect(response.body.message).toContain('sent');

      // Get token from database
      const user = await prisma.user.findUnique({
        where: { email: 'resettest@example.com' },
      });
      resetToken = user?.passwordResetToken || '';
      expect(resetToken).toBeTruthy();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.message).toContain('reset successfully');

      // Verify token is cleared
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.passwordResetToken).toBeNull();
    });

    it('should login with new password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'resettest@example.com',
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
    });

    it('should reject old password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'resettest@example.com',
          password: 'OldPassword123!',
        })
        .expect(401);
    });

    it('should reject invalid reset token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token-123',
          password: 'AnotherPassword123!',
        })
        .expect(400);
    });
  });

  describe('OAuth Provider Management', () => {
    beforeAll(async () => {
      // Create user for OAuth tests
      await prisma.user.deleteMany({ where: { email: 'oauthtest@example.com' } });

      const passwordHash = await argon2.hash('Password123!');
      const user = await prisma.user.create({
        data: {
          email: 'oauthtest@example.com',
          passwordHash,
          emailVerified: true,
          subscription: {
            create: {
              tier: 'FREE',
              status: 'ACTIVE',
            },
          },
        },
      });
      userId = user.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'oauthtest@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const cookies = (loginResponse.headers['set-cookie'] as unknown) as string[];
      authToken = cookies
        .find((cookie: string) => cookie.startsWith('access_token='))
        ?.split(';')[0]
        .split('=')[1] || '';
    });

    it('should list OAuth providers (initially empty)', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/oauth/providers')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should manually add OAuth provider for testing', async () => {
      await prisma.oAuthProvider.create({
        data: {
          userId,
          provider: 'GOOGLE',
          providerId: 'google-test-123',
          isPrimary: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/auth/oauth/providers')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].provider).toBe('GOOGLE');
    });

    it('should unlink OAuth provider', async () => {
      await request(app.getHttpServer())
        .delete('/auth/oauth/providers/GOOGLE')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      const providers = await prisma.oAuthProvider.findMany({
        where: { userId },
      });
      expect(providers).toHaveLength(0);
    });

    it('should not allow unlinking last authentication method', async () => {
      // Remove password and add single OAuth
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: null },
      });

      await prisma.oAuthProvider.create({
        data: {
          userId,
          provider: 'GOOGLE',
          providerId: 'google-only-123',
          isPrimary: true,
        },
      });

      await request(app.getHttpServer())
        .delete('/auth/oauth/providers/GOOGLE')
        .set('Cookie', `access_token=${authToken}`)
        .expect(400);

      // Restore password for other tests
      const passwordHash = await argon2.hash('Password123!');
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
    });
  });
});
