import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { and, eq, ilike, or, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { foodItems } from '../../db/schema';

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
      with: { category: true },
    });

    if (!item || !item.isAvailable) {
      throw new NotFoundException('Food item not found.');
    }

    await this.cache.set(cacheKey, item, 300000);
    return item;
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
}
