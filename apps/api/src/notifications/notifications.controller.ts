import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const userId = req.user.userId;
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedUnreadOnly = unreadOnly === 'true';

    return this.notificationsService.getNotifications(userId, parsedLimit, parsedUnreadOnly);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.userId;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req.user.userId;
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.userId;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async deleteNotification(@Req() req: any, @Param('id') notificationId: string) {
    const userId = req.user.userId;
    await this.notificationsService.deleteNotification(notificationId, userId);
    return { success: true };
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    const userId = req.user.userId;
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences')
  async updatePreferences(@Req() req: any, @Body() data: any) {
    const userId = req.user.userId;
    return this.notificationsService.updatePreferences(userId, data);
  }
}
