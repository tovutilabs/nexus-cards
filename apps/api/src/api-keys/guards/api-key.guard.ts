import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const validatedKey = await this.apiKeysService.validateApiKey(apiKey);
      request.apiKey = validatedKey;
      request.userId = validatedKey.userId;
      request.keyId = validatedKey.keyId;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private extractApiKey(request: any): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return request.headers['x-api-key'] || null;
  }
}
