import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);
  private readonly frontendUrl: string;
  private readonly revalidationSecret: string;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';
    this.revalidationSecret = this.configService.get<string>('REVALIDATION_SECRET') || 'dev-secret';
  }

  async revalidateCard(slug: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.frontendUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          secret: this.revalidationSecret,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Failed to revalidate card ${slug}: ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      this.logger.log(`Successfully revalidated card ${slug}`);
      return true;
    } catch (error) {
      this.logger.error(`Error revalidating card ${slug}:`, error);
      return false;
    }
  }

  async revalidateMultipleCards(slugs: string[]): Promise<void> {
    await Promise.all(slugs.map(slug => this.revalidateCard(slug)));
  }
}
