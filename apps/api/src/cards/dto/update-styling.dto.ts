import { IsString, IsOptional, IsEnum, IsUrl, MaxLength } from 'class-validator';

export enum BackgroundType {
  SOLID = 'solid',
  GRADIENT = 'gradient',
  IMAGE = 'image',
}

export enum Layout {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
  CENTERED = 'centered',
  IMAGE_FIRST = 'image-first',
  COMPACT = 'compact',
}

export enum BorderRadiusPreset {
  NONE = 'none',
  SOFT = 'soft',
  ROUNDED = 'rounded',
  PILL = 'pill',
}

export enum ShadowPreset {
  NONE = 'none',
  SOFT = 'soft',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

export enum FontSizeScale {
  SMALL = 'sm',
  MEDIUM = 'md',
  LARGE = 'lg',
}

export class UpdateCardStylingDto {
  @IsOptional()
  @IsEnum(BackgroundType)
  backgroundType?: BackgroundType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  backgroundColor?: string;

  @IsOptional()
  @IsUrl()
  backgroundImage?: string;

  @IsOptional()
  @IsEnum(Layout)
  layout?: Layout;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fontFamily?: string;

  @IsOptional()
  @IsEnum(FontSizeScale)
  fontSizeScale?: FontSizeScale;

  @IsOptional()
  @IsEnum(BorderRadiusPreset)
  borderRadiusPreset?: BorderRadiusPreset;

  @IsOptional()
  @IsEnum(ShadowPreset)
  shadowPreset?: ShadowPreset;
}

export class UpdateCustomCssDto {
  @IsString()
  @MaxLength(102400) // 100KB max
  customCss: string;
}

export class ArchiveTemplateDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
