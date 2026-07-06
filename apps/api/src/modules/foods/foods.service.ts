import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { and, eq, ilike, or, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { foodItemCombinations, foodItems, orderItems } from '../../db/schema';

import type { CreateFoodDto } from './dto/create-food.dto';
import type { UpdateFoodDto } from './dto/update-food.dto';

@Injectable()
export class FoodsService {
  private readonly logger = new Logger(FoodsService.name);

  constructor(
    private db: DbService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isVeg?: boolean;
  }) {
    const { page = 1, limit = 20, search, categoryId, isVeg } = query;
    const offset = (page - 1) * limit;

    const filters = [
      eq(foodItems.isAvailable, true),
      ...(categoryId ? [eq(foodItems.categoryId, categoryId)] : []),
      ...(isVeg !== undefined ? [eq(foodItems.isVeg, isVeg)] : []),
      ...(search
        ? [or(ilike(foodItems.name, `%${search}%`), ilike(foodItems.description!, `%${search}%`))!]
        : []),
    ];

    const where = filters.length > 1 ? and(...filters) : filters[0];

    const [items, [{ total }]] = await Promise.all([
      this.db.db.query.foodItems.findMany({
        where: () => where!,
        with: { category: { columns: { id: true, name: true, slug: true } } },
        orderBy: (t, { desc }) => [desc(t.rating), desc(t.totalRatings)],
        limit,
        offset,
      }),
      this.db.db
        .select({ total: sql<number>`count(*)::int` })
        .from(foodItems)
        .where(where),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(slug: string) {
    const cacheKey = `food:${slug}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const item = await this.db.db.query.foodItems.findFirst({
      where: (t, { eq }) => eq(t.slug, slug),
      with: {
        category: true,
        combinationLinks: {
          with: {
            combination: {
              columns: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                price: true,
                discountedPrice: true,
                isVeg: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    if (!item || !item.isAvailable) {
      throw new NotFoundException('Food item not found.');
    }

    const result = {
      ...item,
      combinations: item.combinationLinks.map((l) => l.combination),
      combinationLinks: undefined,
    };

    await this.cache.set(cacheKey, result, 300000);
    return result;
  }

  async getFeatured() {
    const cacheKey = 'foods:featured';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const items = await this.db.db.query.foodItems.findMany({
      where: (t, { and, eq }) =>
        and(eq(t.isAvailable, true), sql`${t.tags} @> ARRAY['bestseller']::text[]`),
      with: { category: { columns: { id: true, name: true, slug: true } } },
      orderBy: (t, { desc }) => [desc(t.rating)],
      limit: 10,
    });

    await this.cache.set(cacheKey, items, 600000);
    return items;
  }

  async findAllForAdmin(search?: string, page = 1, limit = 100) {
    const offset = (page - 1) * limit;
    return this.db.db.query.foodItems.findMany({
      where: search ? (t) => ilike(t.name, `%${search}%`) : undefined,
      columns: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        isAvailable: true,
        price: true,
        discountedPrice: true,
        isVeg: true,
        categoryId: true,
      },
      with: {
        category: { columns: { id: true, name: true } },
      },
      orderBy: (t, { asc }) => [asc(t.name)],
      limit,
      offset,
    });
  }

  async findOneForAdmin(id: string) {
    const item = await this.db.db.query.foodItems.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
      with: { category: { columns: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException('Food item not found.');
    return item;
  }

  async setBulkDiscount(items: { id: string; discountedPrice: number | null }[]) {
    const results = await Promise.all(
      items.map(async ({ id, discountedPrice }) => {
        const [updated] = await this.db.db
          .update(foodItems)
          .set({ discountedPrice: discountedPrice !== null ? String(discountedPrice) : null })
          .where(eq(foodItems.id, id))
          .returning({
            id: foodItems.id,
            slug: foodItems.slug,
            discountedPrice: foodItems.discountedPrice,
          });
        if (updated) await this.cache.del(`food:${updated.slug}`);
        return updated;
      }),
    );
    return { updated: results.filter(Boolean).length };
  }

  async toggleAvailability(id: string, isAvailable: boolean) {
    const [updated] = await this.db.db
      .update(foodItems)
      .set({ isAvailable })
      .where(eq(foodItems.id, id))
      .returning({ id: foodItems.id, slug: foodItems.slug, isAvailable: foodItems.isAvailable });
    if (updated) await this.cache.del(`food:${updated.slug}`);
    return updated;
  }

  async setCombinations(foodItemId: string, combinationIds: string[]) {
    await this.db.db
      .delete(foodItemCombinations)
      .where(eq(foodItemCombinations.foodItemId, foodItemId));

    if (combinationIds.length > 0) {
      await this.db.db
        .insert(foodItemCombinations)
        .values(combinationIds.map((id) => ({ foodItemId, combinationId: id })));
    }

    // Invalidate cache for this food item
    const item = await this.db.db.query.foodItems.findFirst({
      where: (t, { eq }) => eq(t.id, foodItemId),
      columns: { slug: true },
    });
    if (item) await this.cache.del(`food:${item.slug}`);

    return { success: true, count: combinationIds.length };
  }

  // ── Admin: Create Food Item ───────────────────────────────────────────────────

  async createFood(dto: CreateFoodDto) {
    this.logger.debug('[FoodsService] createFood', { name: dto.name, categoryId: dto.categoryId });

    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.db.db.query.foodItems.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.slug, slug),
      columns: { id: true },
    });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const [created] = await this.db.db
      .insert(foodItems)
      .values({
        name: dto.name,
        slug: finalSlug,
        categoryId: dto.categoryId,
        description: dto.description,
        price: String(dto.price),
        discountedPrice: dto.discountedPrice != null ? String(dto.discountedPrice) : null,
        imageUrl: dto.imageUrl,
        images: dto.images ?? [],
        isVeg: dto.isVeg,
        isAvailable: dto.isAvailable ?? true,
        preparationTime: dto.preparationTime,
        tags: dto.tags ?? [],
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    await this.cache.del('foods:featured');
    this.logger.debug('[FoodsService] createFood success', { id: created.id });
    return created;
  }

  // ── Admin: Update Food Item ───────────────────────────────────────────────────

  async updateFood(id: string, dto: UpdateFoodDto) {
    this.logger.debug('[FoodsService] updateFood', { id });

    const existing = await this.db.db.query.foodItems.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
    });
    if (!existing) throw new NotFoundException('Food item not found.');

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.categoryId !== undefined) updates.categoryId = dto.categoryId;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.price !== undefined) updates.price = String(dto.price);
    if (dto.discountedPrice !== undefined)
      updates.discountedPrice = dto.discountedPrice !== null ? String(dto.discountedPrice) : null;
    if (dto.imageUrl !== undefined) updates.imageUrl = dto.imageUrl;
    if (dto.images !== undefined) updates.images = dto.images;
    if (dto.isVeg !== undefined) updates.isVeg = dto.isVeg;
    if (dto.isAvailable !== undefined) updates.isAvailable = dto.isAvailable;
    if (dto.preparationTime !== undefined) updates.preparationTime = dto.preparationTime;
    if (dto.tags !== undefined) updates.tags = dto.tags;
    if (dto.sortOrder !== undefined) updates.sortOrder = dto.sortOrder;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No fields provided to update.');
    }

    const [updated] = await this.db.db
      .update(foodItems)
      .set(updates)
      .where(eq(foodItems.id, id))
      .returning();

    await this.cache.del(`food:${existing.slug}`);
    await this.cache.del('foods:featured');
    this.logger.debug('[FoodsService] updateFood success', { id });
    return updated;
  }

  // ── Admin: Delete Food Item ───────────────────────────────────────────────────

  async deleteFood(id: string) {
    this.logger.debug('[FoodsService] deleteFood', { id });

    const existing = await this.db.db.query.foodItems.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
    });
    if (!existing) throw new NotFoundException('Food item not found.');

    // Block deletion if item appears in active (non-terminal) orders
    const activeOrderItem = await this.db.db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.foodItemId, id))
      .limit(1);

    if (activeOrderItem.length > 0) {
      throw new BadRequestException(
        'Cannot delete this food item — it appears in existing orders. Disable availability instead.',
      );
    }

    await this.db.db.delete(foodItems).where(eq(foodItems.id, id));
    await this.cache.del(`food:${existing.slug}`);
    await this.cache.del('foods:featured');
    this.logger.debug('[FoodsService] deleteFood success', { id });
    return { deleted: true };
  }
}
