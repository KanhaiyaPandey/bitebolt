import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { eq } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { categories } from '../../db/schema';

import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private db: DbService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll() {
    const cacheKey = 'categories:all';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.db.db.query.categories.findMany({
      where: (t, { eq: eqFn }) => eqFn(t.isActive, true),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });

    await this.cache.set(cacheKey, result, 600000);
    return result;
  }

  async findAllForAdmin() {
    this.logger.debug('[CategoriesService] findAllForAdmin');
    return this.db.db.query.categories.findMany({
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
      with: { foodItems: { columns: { id: true } } },
    });
  }

  async findOneForAdmin(id: string) {
    const item = await this.db.db.query.categories.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
    });
    if (!item) throw new NotFoundException('Category not found.');
    return item;
  }

  async createCategory(dto: CreateCategoryDto) {
    this.logger.debug('[CategoriesService] createCategory', { name: dto.name });

    const slug =
      dto.slug ??
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const existing = await this.db.db.query.categories.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.slug, slug),
      columns: { id: true },
    });
    if (existing) throw new BadRequestException('A category with this slug already exists.');

    const existingName = await this.db.db.query.categories.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.name, dto.name),
      columns: { id: true },
    });
    if (existingName) throw new BadRequestException('A category with this name already exists.');

    const [created] = await this.db.db
      .insert(categories)
      .values({
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    await this.cache.del('categories:all');
    this.logger.debug('[CategoriesService] createCategory success', { id: created.id });
    return created;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    this.logger.debug('[CategoriesService] updateCategory', { id });

    const existing = await this.db.db.query.categories.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
    });
    if (!existing) throw new NotFoundException('Category not found.');

    if (dto.name !== undefined) {
      const nameClash = await this.db.db.query.categories.findFirst({
        where: (t, { and: andFn, eq: eqFn, ne: neFn }) =>
          andFn(eqFn(t.name, dto.name!), neFn(t.id, id)),
        columns: { id: true },
      });
      if (nameClash) throw new BadRequestException('A category with this name already exists.');
    }

    if (dto.slug !== undefined) {
      const slugClash = await this.db.db.query.categories.findFirst({
        where: (t, { and: andFn, eq: eqFn, ne: neFn }) =>
          andFn(eqFn(t.slug, dto.slug!), neFn(t.id, id)),
        columns: { id: true },
      });
      if (slugClash) throw new BadRequestException('A category with this slug already exists.');
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.slug !== undefined) updates.slug = dto.slug;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.imageUrl !== undefined) updates.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) updates.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updates.sortOrder = dto.sortOrder;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No fields provided to update.');
    }

    const [updated] = await this.db.db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    await this.cache.del('categories:all');
    this.logger.debug('[CategoriesService] updateCategory success', { id });
    return updated;
  }

  async deleteCategory(id: string) {
    this.logger.debug('[CategoriesService] deleteCategory', { id });

    const existing = await this.db.db.query.categories.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
      with: { foodItems: { columns: { id: true }, limit: 1 } },
    });
    if (!existing) throw new NotFoundException('Category not found.');

    if (existing.foodItems.length > 0) {
      throw new BadRequestException(
        'Cannot delete this category — it has food items. Remove or reassign the food items first.',
      );
    }

    await this.db.db.delete(categories).where(eq(categories.id, id));
    await this.cache.del('categories:all');
    this.logger.debug('[CategoriesService] deleteCategory success', { id });
    return { deleted: true };
  }
}
