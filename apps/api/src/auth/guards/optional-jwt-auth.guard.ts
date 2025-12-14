import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to allow unauthenticated requests
  handleRequest(err: any, user: any) {
    // If there's an error or no user, just return null (no user)
    // This allows the request to proceed without authentication
    if (err || !user) {
      return null;
    }
    return user;
  }

  // Override canActivate to always return true
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate, but don't fail if it doesn't work
      await super.canActivate(context);
    } catch (err) {
      // Ignore authentication errors
    }
    // Always allow the request to proceed
    return true;
  }
}
