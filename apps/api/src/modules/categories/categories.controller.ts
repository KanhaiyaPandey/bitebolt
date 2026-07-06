import { UserRole } from '@bitebolt/types';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { Public, Roles } from '../../common/decorators';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // ── Admin Routes ─────────────────────────────────────────────────────────────

  @Get('admin')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.categoriesService.findAllForAdmin();
  }

  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  findOneForAdmin(@Param('id') id: string) {
    return this.categoriesService.findOneForAdmin(id);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch('admin/:id')
  @Roles(UserRole.ADMIN)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
