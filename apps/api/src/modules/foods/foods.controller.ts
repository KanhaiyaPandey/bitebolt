import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { FoodsService } from './foods.service';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

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
}
