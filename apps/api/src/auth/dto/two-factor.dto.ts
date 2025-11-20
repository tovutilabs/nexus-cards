import { IsString } from 'class-validator';

export class Enable2FADto {
  @IsString()
  code: string;
}

export class Verify2FADto {
  @IsString()
  code: string;
}

export class Disable2FADto {
  @IsString()
  code: string;
}

export class GenerateBackupCodesDto {
  @IsString()
  code: string;
}
