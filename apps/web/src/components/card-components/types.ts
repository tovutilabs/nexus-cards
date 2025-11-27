/**
 * Card Component Types and Interfaces
 * 
 * Defines the structure for component-based card builder.
 * Each component type has specific config requirements.
 */

export type ComponentType =
  | 'PROFILE'
  | 'ABOUT'
  | 'CONTACT'
  | 'GALLERY'
  | 'SOCIAL_LINKS'
  | 'CUSTOM_LINKS'
  | 'VIDEO'
  | 'CALENDAR'
  | 'FORM'
  | 'TESTIMONIALS'
  | 'SERVICES';

export interface CardComponent {
  id: string;
  cardId: string;
  type: ComponentType;
  order: number;
  enabled: boolean;
  config: Record<string, any>;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardComponentRendererProps {
  component: CardComponent;
  cardData?: any;
  isEditing?: boolean;
  onEdit?: (component: CardComponent) => void;
  onDelete?: (componentId: string) => void;
  onToggle?: (componentId: string, enabled: boolean) => void;
}

export interface ProfileConfig {
  showAvatar?: boolean;
  showBio?: boolean;
  showJobTitle?: boolean;
  showCompany?: boolean;
  avatarShape?: 'circle' | 'square' | 'rounded';
  layout?: 'center' | 'left' | 'right';
}

export interface AboutConfig {
  bio?: string;
  title?: string;
  showTitle?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  maxLength?: number;
}

export interface ContactConfig {
  showEmail?: boolean;
  showPhone?: boolean;
  showSMS?: boolean;
  showWhatsApp?: boolean;
  customButtons?: Array<{
    label: string;
    url: string;
    icon?: string;
  }>;
  layout?: 'grid' | 'list';
}

export interface GalleryConfig {
  images: Array<{
    url: string;
    caption?: string;
    alt?: string;
  }>;
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: 2 | 3 | 4;
  showCaptions?: boolean;
  lightbox?: boolean;
}

export interface SocialLinksConfig {
  links: Array<{
    platform: string;
    url: string;
    username?: string;
  }>;
  layout?: 'icons' | 'buttons' | 'compact';
  iconSize?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
}

export interface CustomLinksConfig {
  links: Array<{
    title: string;
    url: string;
    icon?: string;
    description?: string;
  }>;
  style?: 'minimal' | 'card' | 'button';
}

export interface VideoConfig {
  url: string;
  platform?: 'youtube' | 'vimeo' | 'custom';
  autoplay?: boolean;
  showControls?: boolean;
  thumbnail?: string;
  title?: string;
}

export interface CalendarConfig {
  calendarUrl?: string;
  platform?: 'calendly' | 'google' | 'outlook' | 'custom';
  buttonText?: string;
  description?: string;
}

export interface FormConfig {
  title?: string;
  fields: Array<{
    name: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    order: number;
  }>;
  submitButtonText: string;
  successMessage?: string;
  emailNotifications?: boolean;
  notificationEmail?: string;
}

export interface TestimonialsConfig {
  testimonials: Array<{
    name: string;
    role?: string;
    company?: string;
    content: string;
    avatar?: string;
    rating?: number;
  }>;
  layout?: 'carousel' | 'grid' | 'list';
  showRatings?: boolean;
}

export interface ServicesConfig {
  services: Array<{
    title: string;
    description: string;
    icon?: string;
    price?: string;
    url?: string;
  }>;
  layout?: 'grid' | 'list';
  columns?: 1 | 2 | 3;
}
