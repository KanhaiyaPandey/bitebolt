import { NotFoundException } from '@nestjs/common';

import { DbService } from '../../db/db.service';
import { clearTables, startTestDb, type TestDb } from '../../test/db-helper';
import { seedCategory, seedFoodItem } from '../../test/fixtures';

import { FoodsService } from './foods.service';

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

describe('FoodsService (integration)', () => {
  let db: TestDb;
  let stopDb: () => Promise<void>;
  let dbService: DbService;
  let service: FoodsService;

  beforeAll(async () => {
    ({ db, stop: stopDb } = await startTestDb());

    dbService = new DbService();
    await dbService.onModuleInit();

    // Inject mock cache manager (bypasses Redis dependency)
    service = new FoodsService(dbService, mockCache as any);
  });

  afterAll(async () => {
    await dbService.onModuleDestroy();
    await stopDb();
  });

  beforeEach(async () => {
    await clearTables(db);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null); // default: cache miss
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all available food items with pagination meta', async () => {
      const category = await seedCategory(db);
      await seedFoodItem(db, category.id, { name: 'Item 1', slug: 'item-1' });
      await seedFoodItem(db, category.id, { name: 'Item 2', slug: 'item-2' });

      const result = await service.findAll({});

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('excludes unavailable food items', async () => {
      const category = await seedCategory(db);
      await seedFoodItem(db, category.id, { name: 'Available', slug: 'available' });
      await seedFoodItem(db, category.id, {
        name: 'Unavailable',
        slug: 'unavailable',
        isAvailable: false,
      });

      const result = await service.findAll({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Available');
    });

    it('filters by search term (name match)', async () => {
      const category = await seedCategory(db);
      await seedFoodItem(db, category.id, { name: 'Butter Chicken', slug: 'butter-chicken' });
      await seedFoodItem(db, category.id, { name: 'Dal Makhani', slug: 'dal-makhani' });

      const result = await service.findAll({ search: 'butter' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Butter Chicken');
    });

    it('filters by categoryId', async () => {
      const cat1 = await seedCategory(db, { name: 'Starters', slug: 'starters' });
      const cat2 = await seedCategory(db, { name: 'Desserts', slug: 'desserts' });
      await seedFoodItem(db, cat1.id, { name: 'Samosa', slug: 'samosa' });
      await seedFoodItem(db, cat2.id, { name: 'Gulab Jamun', slug: 'gulab-jamun' });

      const result = await service.findAll({ categoryId: cat1.id });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Samosa');
    });

    it('filters veg-only items', async () => {
      const category = await seedCategory(db);
      await seedFoodItem(db, category.id, { name: 'Veg Item', slug: 'veg-item', isVeg: true });
      await seedFoodItem(db, category.id, {
        name: 'Non-Veg Item',
        slug: 'nonveg-item',
        isVeg: false,
      });

      const result = await service.findAll({ isVeg: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Veg Item');
    });

    it('returns correct pagination meta', async () => {
      const category = await seedCategory(db);
      for (let i = 1; i <= 5; i++) {
        await seedFoodItem(db, category.id, { name: `Item ${i}`, slug: `item-${i}` });
      }

      const result = await service.findAll({ page: 1, limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the food item by slug and populates the cache', async () => {
      const category = await seedCategory(db);
      await seedFoodItem(db, category.id, { slug: 'paneer-tikka', name: 'Paneer Tikka' });

      const result = await service.findOne('paneer-tikka');

      expect(result).toMatchObject({ slug: 'paneer-tikka', name: 'Paneer Tikka' });
      expect(mockCache.set).toHaveBeenCalledWith(
        'food:paneer-tikka',
        expect.objectContaining({ slug: 'paneer-tikka' }),
        300000,
      );
    });

    it('returns cached value without hitting the DB', async () => {
      const cached = { id: 'cached-food', name: 'Cached Food', slug: 'cached' };
      mockCache.get.mockResolvedValueOnce(cached);

      const result = await service.findOne('cached');

      expect(result).toEqual(cached);
      // Cache was hit, so DB was not queried (no DB calls needed to verify—cache.get was called)
      expect(mockCache.get).toHaveBeenCalledWith('food:cached');
    });

    it('throws NotFoundException when the slug does not exist', async () => {
      await expect(service.findOne('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the food item is not available', async () => {
      const category = await seedCategory(db);
      await seedFoodItem(db, category.id, {
        slug: 'sold-out',
        name: 'Sold Out Item',
        isAvailable: false,
      });

      await expect(service.findOne('sold-out')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getFeatured ────────────────────────────────────────────────────────────

  describe('getFeatured', () => {
    it('returns items tagged as bestseller', async () => {
      const category = await seedCategory(db);
      await seedFoodItem(db, category.id, {
        name: 'Bestseller Item',
        slug: 'bestseller-item',
        tags: ['bestseller'],
      });
      await seedFoodItem(db, category.id, {
        name: 'Regular Item',
        slug: 'regular-item',
        tags: [],
      });

      const result = await service.getFeatured();

      expect(result).toHaveLength(1);
      expect((result as any[])[0].name).toBe('Bestseller Item');
    });

    it('returns cached featured list on subsequent calls', async () => {
      const cached = [{ id: 'cached-featured', name: 'Cached', slug: 'cached' }];
      mockCache.get.mockResolvedValueOnce(cached);

      const result = await service.getFeatured();

      expect(result).toEqual(cached);
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });
});
