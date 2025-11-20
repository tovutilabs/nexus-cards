import { IsString, IsEmail } from 'class-validator';

export class Login2FADto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  twoFactorCode: string;
}
