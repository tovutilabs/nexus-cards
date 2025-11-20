import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsObject } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  industry: string[];

  @IsOptional()
  @IsString()
  previewImageUrl?: string;

  @IsObject()
  config: any;

  @IsEnum(SubscriptionTier)
  minTier: SubscriptionTier;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industry?: string[];

  @IsOptional()
  @IsString()
  previewImageUrl?: string;

  @IsOptional()
  @IsObject()
  config?: any;

  @IsOptional()
  @IsEnum(SubscriptionTier)
  minTier?: SubscriptionTier;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class ApplyTemplateDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsBoolean()
  preserveContent?: boolean;
}
