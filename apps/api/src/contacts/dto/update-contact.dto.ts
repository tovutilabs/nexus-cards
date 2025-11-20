import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { SubmitContactDto } from './submit-contact.dto';

export class UpdateContactDto extends PartialType(SubmitContactDto) {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsBoolean()
  @IsOptional()
  favorite?: boolean;
}
