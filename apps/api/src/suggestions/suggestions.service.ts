import { Injectable } from '@nestjs/common';
import { CardsRepository } from '../cards/cards.repository';
import { UsersService } from '../users/users.service';

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
    private readonly usersService: UsersService
  ) {}

  async getUserSuggestions(userId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    const profileSuggestions = await this.getProfileSuggestions(userId);
    suggestions.push(...profileSuggestions);

    const cardSuggestions = await this.getCardSuggestions(userId);
    suggestions.push(...cardSuggestions);

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
}
