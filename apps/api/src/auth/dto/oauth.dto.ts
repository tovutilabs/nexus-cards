import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { OAuthProviderType } from '@prisma/client';

export class OAuthCallbackDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class LinkOAuthProviderDto {
  @IsEnum(OAuthProviderType)
  provider: OAuthProviderType;

  @IsString()
  providerId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class UnlinkOAuthProviderDto {
  @IsEnum(OAuthProviderType)
  provider: OAuthProviderType;
}
