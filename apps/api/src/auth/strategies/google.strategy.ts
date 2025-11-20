import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private oauthService: OAuthService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'dummy',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'dummy',
      callbackURL: `${configService.get<string>('API_URL') || 'http://localhost:3001'}/auth/oauth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      emails?: Array<{ value: string }>;
      name?: { givenName?: string; familyName?: string };
    },
    done: VerifyCallback
  ): Promise<void> {
    const { id, emails, name } = profile;
    
    const email = emails && emails[0] ? emails[0].value : null;
    
    if (!email) {
      return done(new Error('No email found in Google profile'), false);
    }

    try {
      const user = await this.oauthService.findOrCreateUserFromOAuth(
        'GOOGLE',
        id,
        email,
        name?.givenName,
        name?.familyName
      );

      done(null, user || false);
    } catch (error) {
      done(error as Error, false);
    }
  }
}
