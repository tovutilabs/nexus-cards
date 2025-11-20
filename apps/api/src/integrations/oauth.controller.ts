import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';
import { IntegrationProvider } from '@prisma/client';
import axios from 'axios';

@Controller('integrations/oauth')
@UseGuards(JwtAuthGuard)
export class OAuthController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      return res.redirect(
        '/dashboard/integrations?error=invalid_oauth_callback',
      );
    }

    try {
      const userId = req.user.userId;

      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        },
      );

      const credentials = {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        expiresAt: new Date(
          Date.now() + tokenResponse.data.expires_in * 1000,
        ).toISOString(),
      };

      await this.integrationsService.connectIntegration(userId, {
        provider: IntegrationProvider.GOOGLE_DRIVE,
        credentials,
      });

      return res.redirect('/dashboard/integrations?success=google_connected');
    } catch (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(
        '/dashboard/integrations?error=google_connection_failed',
      );
    }
  }

  @Get('dropbox/callback')
  async dropboxCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      return res.redirect(
        '/dashboard/integrations?error=invalid_oauth_callback',
      );
    }

    try {
      const userId = req.user.userId;

      const tokenResponse = await axios.post(
        'https://api.dropboxapi.com/oauth2/token',
        new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: process.env.DROPBOX_APP_KEY || '',
          client_secret: process.env.DROPBOX_APP_SECRET || '',
          redirect_uri: process.env.DROPBOX_REDIRECT_URI || '',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const credentials = {
        accessToken: tokenResponse.data.access_token,
        accountId: tokenResponse.data.account_id,
      };

      await this.integrationsService.connectIntegration(userId, {
        provider: IntegrationProvider.DROPBOX,
        credentials,
      });

      return res.redirect('/dashboard/integrations?success=dropbox_connected');
    } catch (error) {
      console.error('Dropbox OAuth error:', error);
      return res.redirect(
        '/dashboard/integrations?error=dropbox_connection_failed',
      );
    }
  }

  @Get('google/authorize')
  async googleAuthorize(@Req() req: any, @Res() res: Response) {
    const state = Buffer.from(
      JSON.stringify({ userId: req.user.userId, timestamp: Date.now() }),
    ).toString('base64');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'consent');

    return res.redirect(authUrl.toString());
  }

  @Get('dropbox/authorize')
  async dropboxAuthorize(@Req() req: any, @Res() res: Response) {
    const state = Buffer.from(
      JSON.stringify({ userId: req.user.userId, timestamp: Date.now() }),
    ).toString('base64');

    const authUrl = new URL('https://www.dropbox.com/oauth2/authorize');
    authUrl.searchParams.set('client_id', process.env.DROPBOX_APP_KEY || '');
    authUrl.searchParams.set('redirect_uri', process.env.DROPBOX_REDIRECT_URI || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    return res.redirect(authUrl.toString());
  }
}
