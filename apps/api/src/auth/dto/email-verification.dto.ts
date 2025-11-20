import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  // No body needed, uses authenticated user
}
