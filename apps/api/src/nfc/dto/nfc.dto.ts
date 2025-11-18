import { IsString, IsArray, IsOptional } from 'class-validator';

export class ImportNfcTagsDto {
  @IsArray()
  @IsString({ each: true })
  uids: string[];
}

export class AssignNfcTagDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  userEmail?: string;
}

export class AssociateNfcTagDto {
  @IsString()
  cardId: string;
}

export class ResolveNfcTagDto {
  @IsString()
  uid: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;
}
