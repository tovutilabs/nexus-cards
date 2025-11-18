import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { SubmitContactDto } from './submit-contact.dto';

export class UpdateContactDto extends PartialType(SubmitContactDto) {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
