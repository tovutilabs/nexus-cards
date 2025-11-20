import {
  IsEnum,
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
} from 'class-validator';

export enum ExportFormat {
  CSV = 'CSV',
  VCF = 'VCF',
}

export class ExportContactsDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  favoritesOnly?: boolean;
}
