import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UpdateUserRoleDto,
  UpdateUserSubscriptionDto,
} from './dto/admin-user.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('tier') tier?: string
  ) {
    return this.usersService.listUsersAdmin({
      skip,
      take,
      search,
      role,
      tier,
    });
  }

  @Get(':userId')
  async getUserDetails(@Param('userId') userId: string) {
    return this.usersService.getUserDetailsAdmin(userId);
  }

  @Patch(':userId/role')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto
  ) {
    return this.usersService.updateUserRole(userId, updateRoleDto.role);
  }

  @Patch(':userId/subscription')
  async updateUserSubscription(
    @Param('userId') userId: string,
    @Body() updateSubscriptionDto: UpdateUserSubscriptionDto
  ) {
    return this.usersService.updateUserSubscription(
      userId,
      updateSubscriptionDto
    );
  }

  @Get(':userId/usage')
  async getUserUsage(@Param('userId') userId: string) {
    return this.usersService.getUserUsageMetrics(userId);
  }

  @Get('stats/overview')
  async getUserStats() {
    return this.usersService.getUserStatsAdmin();
  }
}
