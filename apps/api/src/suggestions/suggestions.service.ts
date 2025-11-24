import { Injectable } from '@nestjs/common';
import { CardsRepository } from '../cards/cards.repository';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

export interface Suggestion {
  id: string;
  type: 'profile' | 'link' | 'template' | 'color' | 'feature';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
  metadata?: any;
}

export interface ProfileCompletenessScore {
  score: number;
  maxScore: number;
  percentage: number;
  missingFields: string[];
}

@Injectable()
export class SuggestionsService {
  constructor(
    private readonly cardsRepository: CardsRepository,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService
  ) {}

  async getUserSuggestions(userId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    const profileSuggestions = await this.getProfileSuggestions(userId);
    suggestions.push(...profileSuggestions);

    const cardSuggestions = await this.getCardSuggestions(userId);
    suggestions.push(...cardSuggestions);

    const connectionSuggestions = await this.getConnectionSuggestions(userId);
    suggestions.push(...connectionSuggestions);

    const featureSuggestions = await this.getFeatureSuggestions(userId);
    suggestions.push(...featureSuggestions);

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async getProfileCompletenessScore(userId: string): Promise<ProfileCompletenessScore> {
    const user = await this.usersService.findById(userId);
    const profile = user.profile;

    const fields = [
      { name: 'firstName', value: profile?.firstName, weight: 2 },
      { name: 'lastName', value: profile?.lastName, weight: 2 },
      { name: 'phone', value: profile?.phone, weight: 1 },
      { name: 'company', value: profile?.company, weight: 1 },
      { name: 'jobTitle', value: profile?.jobTitle, weight: 1 },
      { name: 'avatarUrl', value: profile?.avatarUrl, weight: 2 },
    ];

    let score = 0;
    const maxScore = fields.reduce((sum, f) => sum + f.weight, 0);
    const missingFields: string[] = [];

    fields.forEach((field) => {
      if (field.value) {
        score += field.weight;
      } else {
        missingFields.push(field.name);
      }
    });

    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      missingFields,
    };
  }

  private async getProfileSuggestions(userId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const completeness = await this.getProfileCompletenessScore(userId);

    if (completeness.missingFields.includes('avatarUrl')) {
      suggestions.push({
        id: 'add-avatar',
        type: 'profile',
        priority: 'high',
        title: 'Add a profile photo',
        description: 'Cards with photos get 3x more views. Upload your professional headshot.',
        actionText: 'Upload Photo',
        actionUrl: '/dashboard/settings/account',
      });
    }

    if (
      completeness.missingFields.includes('firstName') ||
      completeness.missingFields.includes('lastName')
    ) {
      suggestions.push({
        id: 'complete-name',
        type: 'profile',
        priority: 'high',
        title: 'Complete your name',
        description: 'Help people find and recognize you by adding your full name.',
        actionText: 'Add Name',
        actionUrl: '/dashboard/settings/account',
      });
    }

    if (
      completeness.missingFields.includes('company') ||
      completeness.missingFields.includes('jobTitle')
    ) {
      suggestions.push({
        id: 'add-job-info',
        type: 'profile',
        priority: 'medium',
        title: 'Add your job information',
        description: 'Let connections know where you work and what you do.',
        actionText: 'Add Details',
        actionUrl: '/dashboard/settings/account',
      });
    }

    return suggestions;
  }

  private async getCardSuggestions(userId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const cards = await this.cardsRepository.findByUserId(userId);

    if (cards.length === 0) {
      suggestions.push({
        id: 'create-first-card',
        type: 'feature',
        priority: 'high',
        title: 'Create your first card',
        description: 'Start sharing your professional information with a digital business card.',
        actionText: 'Create Card',
        actionUrl: '/dashboard/cards/new',
      });
      return suggestions;
    }

    const mainCard = cards[0];
    const socialLinks = (mainCard.socialLinks as any) || [];
    const links = Array.isArray(socialLinks) ? socialLinks : [];

    if (links.length === 0) {
      suggestions.push({
        id: 'add-social-links',
        type: 'link',
        priority: 'high',
        title: 'Add social media links',
        description: 'Connect your LinkedIn, Twitter, or other profiles to make networking easier.',
        actionText: 'Add Links',
        actionUrl: `/dashboard/cards/${mainCard.id}`,
      });
    } else if (links.length < 3) {
      const commonPlatforms = ['linkedin', 'twitter', 'github', 'instagram', 'website'];
      const existingPlatforms = links.map((l: any) => l.platform?.toLowerCase());
      const missingPlatforms = commonPlatforms.filter((p) => !existingPlatforms.includes(p));

      if (missingPlatforms.length > 0) {
        suggestions.push({
          id: 'add-more-links',
          type: 'link',
          priority: 'medium',
          title: 'Add more social links',
          description: `Consider adding ${missingPlatforms.slice(0, 2).join(' or ')} to expand your online presence.`,
          actionText: 'Add Links',
          actionUrl: `/dashboard/cards/${mainCard.id}`,
        });
      }
    }

    if (!mainCard.theme || mainCard.theme === 'default') {
      const user = await this.usersService.findById(userId);
      const company = user.profile?.company?.toLowerCase() || '';

      let suggestedTheme = 'professional';
      if (company.includes('tech') || company.includes('software')) {
        suggestedTheme = 'tech';
      } else if (company.includes('creative') || company.includes('design')) {
        suggestedTheme = 'creative';
      }

      suggestions.push({
        id: 'customize-theme',
        type: 'template',
        priority: 'low',
        title: 'Customize your card theme',
        description: `Try the "${suggestedTheme}" theme to match your industry and stand out.`,
        actionText: 'Browse Themes',
        actionUrl: `/dashboard/cards/${mainCard.id}/customize`,
      });
    }

    const theme = (mainCard.theme as any) || {};
    if (!theme.primaryColor && !mainCard.backgroundColor) {
      const industryColors = {
        tech: '#3b82f6',
        creative: '#8b5cf6',
        finance: '#1e40af',
        healthcare: '#059669',
        education: '#dc2626',
      };

      const user = await this.usersService.findById(userId);
      const company = user.profile?.company?.toLowerCase() || '';
      let suggestedColor = '#3b82f6';

      for (const [industry, color] of Object.entries(industryColors)) {
        if (company.includes(industry)) {
          suggestedColor = color;
          break;
        }
      }

      suggestions.push({
        id: 'customize-color',
        type: 'color',
        priority: 'low',
        title: 'Choose a brand color',
        description: 'Add your brand color to make your card memorable and professional.',
        actionText: 'Customize Colors',
        actionUrl: `/dashboard/cards/${mainCard.id}/customize`,
        metadata: { suggestedColor },
      });
    }

    return suggestions;
  }

  private async getFeatureSuggestions(userId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    const cards = await this.cardsRepository.findByUserId(userId);

    if (cards.length > 0) {
      suggestions.push({
        id: 'try-nfc',
        type: 'feature',
        priority: 'medium',
        title: 'Try NFC technology',
        description: 'Link your card to an NFC tag for instant sharing with a tap.',
        actionText: 'Learn More',
        actionUrl: '/dashboard/nfc',
      });
    }

    return suggestions;
  }

  /**
   * Get connection-based suggestions using mutual connections, industry, and company matching
   */
  private async getConnectionSuggestions(userId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    
    // Get user's profile data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user?.profile) {
      return suggestions;
    }

    // Get user's existing connections
    const existingConnections = await this.prisma.connection.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    });

    const connectedUserIds = new Set(
      existingConnections.map((conn) =>
        conn.userAId === userId ? conn.userBId : conn.userAId
      )
    );

    // Find mutual connections (2nd degree connections)
    const mutualConnectionCandidates = await this.findMutualConnectionCandidates(
      userId,
      connectedUserIds
    );

    // Find users in same company
    const companyMatches = user.profile.company
      ? await this.findCompanyMatches(userId, user.profile.company, connectedUserIds)
      : [];

    // Find users in same industry (based on jobTitle keywords)
    const industryMatches = user.profile.jobTitle
      ? await this.findIndustryMatches(userId, user.profile.jobTitle, connectedUserIds)
      : [];

    // Generate suggestions based on findings
    if (mutualConnectionCandidates.length > 0) {
      const topCandidate = mutualConnectionCandidates[0];
      suggestions.push({
        id: `connect-mutual-${topCandidate.userId}`,
        type: 'profile',
        priority: 'high',
        title: 'Connect with mutual connections',
        description: `You have ${topCandidate.mutualCount} mutual connection(s) with ${topCandidate.name}. Expand your network!`,
        actionText: 'View Profile',
        actionUrl: `/dashboard/network/users/${topCandidate.userId}`,
        metadata: { 
          userId: topCandidate.userId,
          mutualCount: topCandidate.mutualCount,
          type: 'mutual',
        },
      });
    }

    if (companyMatches.length > 0) {
      suggestions.push({
        id: `connect-company`,
        type: 'profile',
        priority: 'medium',
        title: `Connect with colleagues at ${user.profile.company}`,
        description: `${companyMatches.length} user(s) from your company are on Nexus Cards. Build your internal network!`,
        actionText: 'View Colleagues',
        actionUrl: `/dashboard/network/suggestions?type=company`,
        metadata: { 
          count: companyMatches.length,
          company: user.profile.company,
          type: 'company',
        },
      });
    }

    if (industryMatches.length > 0 && suggestions.length < 3) {
      suggestions.push({
        id: `connect-industry`,
        type: 'profile',
        priority: 'low',
        title: 'Connect with industry peers',
        description: `${industryMatches.length} professional(s) in your industry. Grow your professional circle!`,
        actionText: 'View Peers',
        actionUrl: `/dashboard/network/suggestions?type=industry`,
        metadata: { 
          count: industryMatches.length,
          type: 'industry',
        },
      });
    }

    return suggestions;
  }

  /**
   * Find users who share mutual connections with the current user
   */
  private async findMutualConnectionCandidates(
    userId: string,
    existingConnections: Set<string>
  ): Promise<Array<{ userId: string; name: string; mutualCount: number }>> {
    // Get all connections of user's connections (2nd degree)
    const connections = await this.prisma.connection.findMany({
      where: {
        OR: [
          { userAId: { in: Array.from(existingConnections) } },
          { userBId: { in: Array.from(existingConnections) } },
        ],
      },
      include: {
        userA: { include: { profile: true } },
        userB: { include: { profile: true } },
      },
    });

    // Count mutual connections for each candidate
    const mutualConnectionMap = new Map<string, { count: number; user: any }>();

    connections.forEach((conn) => {
      const candidateId = existingConnections.has(conn.userAId) ? conn.userBId : conn.userAId;
      
      // Skip if already connected or is the current user
      if (candidateId === userId || existingConnections.has(candidateId)) {
        return;
      }

      const candidate = existingConnections.has(conn.userAId) ? conn.userB : conn.userA;
      
      if (!mutualConnectionMap.has(candidateId)) {
        mutualConnectionMap.set(candidateId, { count: 0, user: candidate });
      }
      
      mutualConnectionMap.get(candidateId)!.count++;
    });

    // Convert to array and sort by mutual connection count
    return Array.from(mutualConnectionMap.entries())
      .map(([userId, data]) => ({
        userId,
        name: data.user.profile
          ? `${data.user.profile.firstName || ''} ${data.user.profile.lastName || ''}`.trim() || 'User'
          : 'User',
        mutualCount: data.count,
      }))
      .sort((a, b) => b.mutualCount - a.mutualCount)
      .slice(0, 5); // Top 5 candidates
  }

  /**
   * Find users in the same company
   */
  private async findCompanyMatches(
    userId: string,
    company: string,
    existingConnections: Set<string>
  ): Promise<string[]> {
    const matches = await this.prisma.userProfile.findMany({
      where: {
        company: {
          equals: company,
          mode: 'insensitive',
        },
        userId: {
          not: userId,
          notIn: Array.from(existingConnections),
        },
      },
      select: { userId: true },
      take: 10,
    });

    return matches.map((m) => m.userId);
  }

  /**
   * Find users in similar industry based on job title keywords
   */
  private async findIndustryMatches(
    userId: string,
    jobTitle: string,
    existingConnections: Set<string>
  ): Promise<string[]> {
    // Extract industry keywords from job title
    const keywords = jobTitle.toLowerCase().split(/[\s,]+/);
    const industryKeywords = keywords.filter(
      (k) =>
        k.length > 3 &&
        !['the', 'and', 'for', 'with', 'from'].includes(k)
    );

    if (industryKeywords.length === 0) {
      return [];
    }

    // Search for users with similar job titles
    const matches = await this.prisma.userProfile.findMany({
      where: {
        jobTitle: {
          contains: industryKeywords[0], // Use first keyword for search
          mode: 'insensitive',
        },
        userId: {
          not: userId,
          notIn: Array.from(existingConnections),
        },
      },
      select: { userId: true },
      take: 10,
    });

    return matches.map((m) => m.userId);
  }
}
