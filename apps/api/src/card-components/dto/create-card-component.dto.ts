import { IsEnum, IsBoolean, IsInt, IsOptional, IsObject, IsString, Min } from 'class-validator';
import { ComponentType } from '@prisma/client';

export class CreateCardComponentDto {
  @IsEnum(ComponentType)
  type: ComponentType;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @IsString()
  @IsOptional()
  backgroundType?: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsString()
  @IsOptional()
  backgroundGradientStart?: string;

  @IsString()
  @IsOptional()
  backgroundGradientEnd?: string;

  @IsString()
  @IsOptional()
  backgroundImageUrl?: string;
}
