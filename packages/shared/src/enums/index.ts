export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
}

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DRAFT = 'DRAFT',
}

export enum NfcTagStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  REVOKED = 'REVOKED',
}

export enum AnalyticsEventType {
  VIEW = 'VIEW',
  LINK_CLICK = 'LINK_CLICK',
  CONTACT_SUBMIT = 'CONTACT_SUBMIT',
  NFC_TAP = 'NFC_TAP',
}

export enum AnalyticsSource {
  QR = 'QR',
  DIRECT = 'DIRECT',
  NFC = 'NFC',
  EMAIL = 'EMAIL',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER',
}
