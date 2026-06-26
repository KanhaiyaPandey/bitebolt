import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { and, eq, ilike, or, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { foodItemCombinations, foodItems } from '../../db/schema';

@Injectable()
export class FoodsService {
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

  async findAllForAdmin() {
    return this.db.db.query.foodItems.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        isAvailable: true,
        price: true,
        isVeg: true,
      },
      with: {
        combinationLinks: {
          columns: { combinationId: true },
        },
      },
      orderBy: (t, { asc }) => [asc(t.name)],
    });
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
}
