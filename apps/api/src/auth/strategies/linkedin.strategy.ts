import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../oauth.service';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(
    private configService: ConfigService,
    private oauthService: OAuthService
  ) {
    super({
      clientID: configService.get<string>('LINKEDIN_CLIENT_ID') || 'dummy',
      clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET') || 'dummy',
      callbackURL: `${configService.get<string>('API_URL') || 'http://localhost:3001'}/auth/oauth/linkedin/callback`,
      scope: ['r_emailaddress', 'r_liteprofile'],
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
    done: (error: Error | null, user?: Express.User | false) => void
  ): Promise<void> {
    const { id, emails, name } = profile;
    
    const email = emails && emails[0] ? emails[0].value : null;
    
    if (!email) {
      return done(new Error('No email found in LinkedIn profile'), false);
    }

    try {
      const user = await this.oauthService.findOrCreateUserFromOAuth(
        'LINKEDIN',
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
