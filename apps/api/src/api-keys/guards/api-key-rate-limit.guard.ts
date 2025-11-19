import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ApiKeyRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (apiKey && req.user?.keyId) {
      return `api-key:${req.user.keyId}`;
    }

    return req.ip;
  }

  protected throwThrottlingException(
    _context: ExecutionContext
  ): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}
