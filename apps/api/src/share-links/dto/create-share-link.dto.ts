import { IsString, IsOptional, IsBoolean, IsEnum, IsDate, MinLength, MaxLength, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { CardPrivacyMode, ShareChannel } from '@prisma/client';

export class CreateShareLinkDto {
  @IsString()
  cardId: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(CardPrivacyMode)
  @IsOptional()
  privacyMode?: CardPrivacyMode;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  allowContactSubmission?: boolean;

  @IsEnum(ShareChannel)
  @IsOptional()
  channel?: ShareChannel;

  @IsInt()
  @IsPositive()
  @IsOptional()
  maxUses?: number; // Null = unlimited, positive number = limited uses
}

export class UpdateShareLinkDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(CardPrivacyMode)
  @IsOptional()
  privacyMode?: CardPrivacyMode;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  allowContactSubmission?: boolean;

  @IsInt()
  @IsPositive()
  @IsOptional()
  maxUses?: number; // Null = unlimited, positive number = limited uses
}

export class ValidateShareLinkDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  password?: string;
}
