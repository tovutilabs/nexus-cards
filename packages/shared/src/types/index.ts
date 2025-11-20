export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  subscriptionTier: 'FREE' | 'PRO' | 'PREMIUM';
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  userId: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  templateId?: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  theme?: Record<string, unknown>;
  customCss?: string;
  socialLinks?: Record<string, string>;
  secondaryLanguage?: string;
  firstName_es?: string;
  lastName_es?: string;
  jobTitle_es?: string;
  company_es?: string;
  bio_es?: string;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  ownerUserId: string;
  sourceCardId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  note: string | null;
  createdFrom: 'FORM' | 'QR' | 'IMPORT' | 'MANUAL';
  createdAt: Date;
  updatedAt: Date;
}
