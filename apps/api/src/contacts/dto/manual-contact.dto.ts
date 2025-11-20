import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEmail,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ContactSource } from '@nexus-cards/shared';

export class CreateManualContactDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  jobTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  favorite?: boolean;

  @IsEnum(ContactSource)
  @IsOptional()
  source?: ContactSource;
}
