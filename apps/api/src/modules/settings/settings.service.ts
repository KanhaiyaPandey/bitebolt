import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { DbService } from '../../db/db.service';
import { appConfig } from '../../db/schema';

const DELIVERY_FEE_KEY = 'delivery_fee';
const CACHE_KEY = 'settings:delivery_fee';
const DEFAULT_DELIVERY_FEE = 40;

@Injectable()
export class SettingsService {
  constructor(
    private db: DbService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async getDeliveryFee(): Promise<number> {
    const cached = await this.cache.get<number>(CACHE_KEY);
    if (cached !== null && cached !== undefined) return cached;

    const row = await this.db.db.query.appConfig.findFirst({
      where: (t, { eq }) => eq(t.key, DELIVERY_FEE_KEY),
    });
    const fee = row ? Number(row.value) : DEFAULT_DELIVERY_FEE;
    await this.cache.set(CACHE_KEY, fee, 3600);
    return fee;
  }

  async setDeliveryFee(value: number): Promise<{ deliveryFee: number }> {
    await this.db.db
      .insert(appConfig)
      .values({ key: DELIVERY_FEE_KEY, value: String(value) })
      .onConflictDoUpdate({ target: appConfig.key, set: { value: String(value) } });
    await this.cache.del(CACHE_KEY);
    return { deliveryFee: value };
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.db.query.appConfig.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
}
