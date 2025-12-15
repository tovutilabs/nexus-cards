import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CardComponent } from '@prisma/client';

/**
 * TemplateComponentFactory
 * 
 * Automatically creates card components when a template is applied.
 * Each template has a blueprint that defines which components should be created
 * and their default configurations.
 */
@Injectable()
export class TemplateComponentFactory {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates components for a specific template
   * @param templateSlug The template identifier (e.g., 'basic-business')
   * @param cardId The card to create components for
   * @param cardData The card's data (used to pre-populate component configs)
   * @returns Array of created components
   */
  async createComponentsForTemplate(
    templateSlug: string,
    cardId: string,
    cardData: any,
  ): Promise<CardComponent[]> {
    const factories: Record<string, () => Promise<CardComponent[]>> = {
      'basic-business': () => this.createBasicBusinessComponents(cardId, cardData),
      // Add more template factories here as needed
      // 'photographer-split': () => this.createPhotographerSplitComponents(cardId, cardData),
      // 'photographer-wave': () => this.createPhotographerWaveComponents(cardId, cardData),
    };

    const factory = factories[templateSlug];
    if (!factory) {
      console.log(`No component factory found for template: ${templateSlug}`);
      return [];
    }

    try {
      return await factory();
    } catch (error) {
      console.error(`Failed to create components for template ${templateSlug}:`, error);
      throw error;
    }
  }

  /**
   * Gets the component blueprint for a template without creating them
   * Useful for previewing what components will be created
   */
  getBlueprint(templateSlug: string): any {
    const blueprints: Record<string, any> = {
      'basic-business': {
        components: [
          {
            type: 'PROFILE',
            order: 0,
            config: {
              variant: 'basic-business',
              showAvatar: true,
              showJobTitle: true,
              showCompany: true,
              showBio: false,
              avatarShape: 'circle',
              avatarSize: 'lg',
            },
          },
          {
            type: 'CONTACT',
            order: 1,
            config: {
              variant: 'basic-business',
              layout: 'tiles',
              showEmail: true,
              showPhone: true,
              showWebsite: true,
              showAddress: true,
            },
          },
          {
            type: 'SOCIAL_LINKS',
            order: 2,
            config: {
              variant: 'basic-business',
              layout: 'circles',
              title: 'Connect With Me',
              platforms: ['linkedin', 'twitter', 'github'],
            },
          },
        ],
      },
    };

    return blueprints[templateSlug] || null;
  }

  /**
   * Creates components for the Basic Business template
   * - PROFILE: Gradient header with avatar and contact info
   * - CONTACT: Colored tile buttons (phone, email, website, location)
   * - SOCIAL_LINKS: Circular social media buttons
   */
  private async createBasicBusinessComponents(
    cardId: string,
    cardData: any,
  ): Promise<CardComponent[]> {
    const components: CardComponent[] = [];

    // PROFILE component - Always create (shows name and avatar)
    const profileComponent = await this.prisma.cardComponent.create({
      data: {
        cardId,
        type: 'PROFILE',
        order: 0,
        enabled: true,
        config: {
          variant: 'basic-business',
          showAvatar: true,
          showJobTitle: !!cardData.jobTitle,
          showCompany: !!cardData.company,
          showBio: false,
          avatarShape: 'circle',
          avatarSize: 'lg',
        },
      },
    });
    components.push(profileComponent);

    // CONTACT component - Create if any contact info exists
    const hasContactInfo =
      cardData.email || cardData.phone || cardData.website || cardData.socialLinks?.address;

    if (hasContactInfo) {
      const contactComponent = await this.prisma.cardComponent.create({
        data: {
          cardId,
          type: 'CONTACT',
          order: 1,
          enabled: true,
          config: {
            variant: 'basic-business',
            layout: 'tiles',
            showEmail: !!cardData.email,
            showPhone: !!cardData.phone,
            showWebsite: !!cardData.website,
            showAddress: !!cardData.socialLinks?.address,
          },
        },
      });
      components.push(contactComponent);
    }

    // SOCIAL_LINKS component - Create if any social links exist
    const socialLinks = cardData.socialLinks || {};
    const platforms: string[] = [];

    if (socialLinks.linkedinUrl || socialLinks.linkedin) platforms.push('linkedin');
    if (socialLinks.twitterUrl || socialLinks.twitter) platforms.push('twitter');
    if (socialLinks.githubUrl || socialLinks.github) platforms.push('github');
    if (socialLinks.facebookUrl || socialLinks.facebook) platforms.push('facebook');
    if (socialLinks.instagramUrl || socialLinks.instagram) platforms.push('instagram');
    if (socialLinks.youtubeUrl || socialLinks.youtube) platforms.push('youtube');

    if (platforms.length > 0) {
      const socialComponent = await this.prisma.cardComponent.create({
        data: {
          cardId,
          type: 'SOCIAL_LINKS',
          order: 2,
          enabled: true,
          config: {
            variant: 'basic-business',
            layout: 'circles',
            title: 'Connect With Me',
            platforms,
          },
        },
      });
      components.push(socialComponent);
    }

    console.log(
      `Created ${components.length} components for basic-business template on card ${cardId}`,
    );

    return components;
  }
}
