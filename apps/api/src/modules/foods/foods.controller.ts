import { UserRole } from '@bitebolt/types';
import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';

import { Public, Roles } from '../../common/decorators';

import { FoodsService } from './foods.service';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  // ── Public ───────────────────────────────────────────────────────────────────

  @Public()
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isVeg') isVeg?: string,
  ) {
    return this.foodsService.findAll({
      page: +page,
      limit: +limit,
      search,
      categoryId,
      isVeg: isVeg !== undefined ? isVeg === 'true' : undefined,
    });
  }

  @Public()
  @Get('featured')
  getFeatured() {
    return this.foodsService.getFeatured();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.foodsService.findOne(slug);
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  @Get('admin/list')
  @Roles(UserRole.ADMIN)
  getAdminList() {
    return this.foodsService.findAllForAdmin();
  }

  @Patch('admin/discount')
  @Roles(UserRole.ADMIN)
  setBulkDiscount(@Body() body: { items: { id: string; discountedPrice: number | null }[] }) {
    return this.foodsService.setBulkDiscount(body.items);
  }

  @Patch('admin/:id/availability')
  @Roles(UserRole.ADMIN)
  toggleAvailability(@Param('id') id: string, @Body() body: { isAvailable: boolean }) {
    return this.foodsService.toggleAvailability(id, body.isAvailable);
  }

  @Put('admin/:id/combinations')
  @Roles(UserRole.ADMIN)
  setCombinations(@Param('id') id: string, @Body() body: { combinationIds: string[] }) {
    return this.foodsService.setCombinations(id, body.combinationIds);
  }
}
