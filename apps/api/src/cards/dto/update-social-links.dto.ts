import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLinkDto {
  @IsString()
  platform: string;

  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateSocialLinksDto {
  @IsObject()
  socialLinks: Record<string, string>;
}

export class AddSocialLinkDto {
  @IsString()
  platform: string;

  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateSocialLinkDto {
  @IsString()
  platform: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url?: string;

  @IsOptional()
  @IsString()
  label?: string;
}
