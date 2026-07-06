import { UserRole } from '@bitebolt/types';
import { Controller, Get, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators';

import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@Roles(UserRole.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('daily-sales')
  getDailySales(@Query('days') days = '7') {
    return this.analyticsService.getDailySales(+days);
  }

  @Get('popular-items')
  getPopularItems(@Query('limit') limit = '10') {
    return this.analyticsService.getPopularItems(+limit);
  }

  @Get('order-stats')
  getOrderStats() {
    return this.analyticsService.getOrderStats();
  }
}
