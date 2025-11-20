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

export enum CardPrivacyMode {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PASSWORD_PROTECTED = 'PASSWORD_PROTECTED',
}

export enum ShareChannel {
  DIRECT = 'DIRECT',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  LINKEDIN = 'LINKEDIN',
}

export enum ContactSource {
  FORM = 'FORM',
  QR = 'QR',
  IMPORTED = 'IMPORTED',
  MANUAL = 'MANUAL',
}

export enum ExportFormat {
  CSV = 'CSV',
  VCF = 'VCF',
}
