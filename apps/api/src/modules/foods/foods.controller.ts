import { UserRole } from '@bitebolt/types';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';

import { Public, Roles } from '../../common/decorators';

import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
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
  getAdminList(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '100',
  ) {
    return this.foodsService.findAllForAdmin(search, +page, +limit);
  }

  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  getOneForAdmin(@Param('id') id: string) {
    return this.foodsService.findOneForAdmin(id);
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

  @Post('admin')
  @Roles(UserRole.ADMIN)
  createFood(@Body() dto: CreateFoodDto) {
    return this.foodsService.createFood(dto);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  updateFood(@Param('id') id: string, @Body() dto: UpdateFoodDto) {
    return this.foodsService.updateFood(id, dto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  deleteFood(@Param('id') id: string) {
    return this.foodsService.deleteFood(id);
  }
}
