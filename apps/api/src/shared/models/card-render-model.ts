export interface IdentityHeader {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  phone?: string;
  email?: string;
  website?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface EffectiveStyling {
  backgroundType: string;
  backgroundColor: string;
  backgroundImage?: string;
  layout: string;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
  shadowPreset: string;
  customCss?: string;
  theme?: any;
}

export interface ComponentConfig {
  id: string;
  type: string;
  order: number;
  enabled: boolean;
  locked: boolean;
  config: any;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface CardRenderModel {
  id: string;
  slug: string;
  status: string;
  identityHeader: IdentityHeader;
  styling: EffectiveStyling;
  components: ComponentConfig[];
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}
