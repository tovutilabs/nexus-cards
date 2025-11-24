import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';

/**
 * Redirect controller for handling frontend routes accessed on the API server
 * Redirects users to the correct web frontend URL
 */
@Controller()
export class RedirectController {
  private readonly webUrl = process.env.WEB_URL || 'http://localhost:3000';

  @Get('p/:slug')
  redirectToPublicCard(@Param('slug') slug: string, @Res() res: Response) {
    const redirectUrl = `${this.webUrl}/p/${slug}`;
    return res.redirect(301, redirectUrl);
  }

  @Get('s/:token')
  redirectToShareLink(@Param('token') token: string, @Res() res: Response) {
    const redirectUrl = `${this.webUrl}/s/${token}`;
    return res.redirect(301, redirectUrl);
  }
}
