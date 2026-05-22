import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { DbService } from '../../db/db.service';

@Injectable()
export class CategoriesService {
  constructor(
    private db: DbService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll() {
    const cacheKey = 'categories:all';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.db.db.query.categories.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });

    await this.cache.set(cacheKey, result, 600000);
    return result;
  }
}
