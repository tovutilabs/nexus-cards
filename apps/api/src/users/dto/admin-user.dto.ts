import { IsEnum, IsString, IsOptional } from 'class-validator';
import { UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserSubscriptionDto {
  @IsEnum(SubscriptionTier)
  @IsOptional()
  tier?: SubscriptionTier;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsString()
  @IsOptional()
  stripeCustomerId?: string;

  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string;
}
