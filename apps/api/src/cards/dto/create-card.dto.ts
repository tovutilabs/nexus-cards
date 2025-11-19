import { IsString, IsOptional, IsUrl, IsObject, MaxLength, MinLength, IsEnum } from 'class-validator';

enum CardStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export class CreateCardDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  templateId?: string;

  @IsOptional()
  @IsObject()
  theme?: Record<string, any>;

  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  secondaryLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName_es?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName_es?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle_es?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company_es?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio_es?: string;
}
