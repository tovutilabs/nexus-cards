import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { IntegrationProvider } from '@prisma/client';

export class ConnectIntegrationDto {
  @IsEnum(IntegrationProvider)
  provider: IntegrationProvider;

  @IsObject()
  credentials: Record<string, any>;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
