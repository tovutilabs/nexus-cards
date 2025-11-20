import {
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ContactImportRowDto {
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
}

export class ImportContactsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactImportRowDto)
  contacts: ContactImportRowDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  favorite?: boolean;
}

export class ContactImportPreviewDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactImportRowDto)
  contacts: ContactImportRowDto[];
}
