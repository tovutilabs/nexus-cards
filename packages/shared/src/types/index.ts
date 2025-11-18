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
  title: string;
  isDefault: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
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
