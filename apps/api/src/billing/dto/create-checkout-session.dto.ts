import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CreateCheckoutSessionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
