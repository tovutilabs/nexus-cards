import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareLinkDto, UpdateShareLinkDto, ValidateShareLinkDto } from './dto/create-share-link.dto';
import { CardPrivacyMode, ShareChannel } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class ShareLinksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique, unguessable token for a share link
   */
  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Create a new share link for a card
   */
  async create(userId: string, dto: CreateShareLinkDto) {
    // Verify the card belongs to the user
    const card = await this.prisma.card.findUnique({
      where: { id: dto.cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to create share links for this card');
    }

    // Validate expiration date
    if (dto.expiresAt && dto.expiresAt <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await argon2.hash(dto.password);
    }

    // Generate unique token
    const token = this.generateToken();

    // Create share link
    const shareLink = await this.prisma.shareLink.create({
      data: {
        cardId: dto.cardId,
        token,
        name: dto.name,
        privacyMode: dto.privacyMode || CardPrivacyMode.PUBLIC,
        passwordHash,
        expiresAt: dto.expiresAt,
        maxUses: dto.maxUses,
        allowContactSubmission: dto.allowContactSubmission ?? true,
        channel: dto.channel || ShareChannel.DIRECT,
      },
    });

    return {
      ...shareLink,
      passwordHash: undefined, // Don't return the hash
      url: this.generateShareUrl(token),
    };
  }

  /**
   * Get all share links for a card
   */
  async findByCard(userId: string, cardId: string) {
    // Verify the card belongs to the user
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view share links for this card');
    }

    const shareLinks = await this.prisma.shareLink.findMany({
      where: {
        cardId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return shareLinks.map((link) => ({
      ...link,
      passwordHash: undefined, // Don't return the hash
      url: this.generateShareUrl(link.token),
      isExpired: link.expiresAt ? link.expiresAt < new Date() : false,
      hasPassword: !!link.passwordHash,
    }));
  }

  /**
   * Get a single share link by ID
   */
  async findOne(userId: string, id: string) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { id },
      include: { card: true },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this share link');
    }

    return {
      ...shareLink,
      passwordHash: undefined,
      url: this.generateShareUrl(shareLink.token),
      isExpired: shareLink.expiresAt ? shareLink.expiresAt < new Date() : false,
      hasPassword: !!shareLink.passwordHash,
    };
  }

  /**
   * Update a share link
   */
  async update(userId: string, id: string, dto: UpdateShareLinkDto) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { id },
      include: { card: true },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this share link');
    }

    // Validate expiration date
    if (dto.expiresAt && dto.expiresAt <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    // Hash new password if provided
    let passwordHash: string | undefined;
    if (dto.password !== undefined) {
      if (dto.password) {
        passwordHash = await argon2.hash(dto.password);
      } else {
        passwordHash = null as any; // Clear password
      }
    }

    const updated = await this.prisma.shareLink.update({
      where: { id },
      data: {
        name: dto.name,
        privacyMode: dto.privacyMode,
        passwordHash: passwordHash !== undefined ? passwordHash : undefined,
        expiresAt: dto.expiresAt,
        maxUses: dto.maxUses,
        allowContactSubmission: dto.allowContactSubmission,
      },
    });

    return {
      ...updated,
      passwordHash: undefined,
      url: this.generateShareUrl(updated.token),
      isExpired: updated.expiresAt ? updated.expiresAt < new Date() : false,
      hasPassword: !!updated.passwordHash,
    };
  }

  /**
   * Revoke (soft delete) a share link
   */
  async revoke(userId: string, id: string) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { id },
      include: { card: true },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to revoke this share link');
    }

    await this.prisma.shareLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return { message: 'Share link revoked successfully' };
  }

  /**
   * Validate a share link token and optional password
   */
  async validateShareLink(dto: ValidateShareLinkDto) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token: dto.token },
      include: { card: true },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    // Check if revoked
    if (shareLink.revokedAt) {
      throw new UnauthorizedException('This share link has been revoked');
    }

    // Check if expired
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new UnauthorizedException('This share link has expired');
    }

    // Check if max uses reached
    if (shareLink.maxUses && shareLink.usedCount >= shareLink.maxUses) {
      throw new UnauthorizedException('This share link has reached its maximum number of uses');
    }

    // Check password if required
    if (shareLink.passwordHash) {
      if (!dto.password) {
        throw new UnauthorizedException('Password required');
      }

      const isValid = await argon2.verify(shareLink.passwordHash, dto.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Increment share count, used count, and update last accessed
    await this.prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        shareCount: { increment: 1 },
        usedCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    return {
      valid: true,
      card: shareLink.card,
      allowContactSubmission: shareLink.allowContactSubmission,
    };
  }

  /**
   * Get share link by token (public method for card access)
   */
  async findByToken(token: string) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token },
      include: { card: true },
    });

    if (!shareLink) {
      return null;
    }

    // Check if revoked
    if (shareLink.revokedAt) {
      return null;
    }

    // Check if expired
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return null;
    }

    // Check if max uses reached
    if (shareLink.maxUses && shareLink.usedCount >= shareLink.maxUses) {
      return null;
    }

    return {
      ...shareLink,
      requiresPassword: !!shareLink.passwordHash,
      isExhausted: shareLink.maxUses ? shareLink.usedCount >= shareLink.maxUses : false,
      usesRemaining: shareLink.maxUses ? Math.max(0, shareLink.maxUses - shareLink.usedCount) : null,
    };
  }

  /**
   * Generate full share URL
   */
  private generateShareUrl(token: string): string {
    // In production, this would use the actual domain
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/s/${token}`;
  }

  /**
   * Generate multi-channel share URLs
   */
  generateChannelUrls(shareUrl: string, cardTitle: string) {
    const encodedUrl = encodeURIComponent(shareUrl);
    const message = encodeURIComponent(`Check out my digital business card: ${cardTitle}`);

    return {
      whatsapp: `https://wa.me/?text=${message}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${message}`,
      sms: `sms:?body=${message}%20${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent(cardTitle)}&body=${message}%20${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
  }

  /**
   * Generate QR code for a share link
   */
  async generateQRCode(userId: string, id: string): Promise<Buffer> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { id },
      include: { card: true },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to generate QR code for this share link');
    }

    const shareUrl = this.generateShareUrl(shareLink.token);
    
    try {
      const qrCodeBuffer = await QRCode.toBuffer(shareUrl, {
        type: 'png',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      return qrCodeBuffer;
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }
}
