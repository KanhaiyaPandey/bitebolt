import { NotFoundException } from '@nestjs/common';
import { calculateCartTotals } from '@bitebolt/utils';

import { DbService } from '../../db/db.service';
import { clearTables, startTestDb, type TestDb } from '../../test/db-helper';
import { seedCartItem, seedCategory, seedFoodItem, seedUser } from '../../test/fixtures';

import { CartService } from './cart.service';

describe('CartService (integration)', () => {
  let db: TestDb;
  let stopDb: () => Promise<void>;
  let dbService: DbService;
  let service: CartService;

  beforeAll(async () => {
    ({ db, stop: stopDb } = await startTestDb());

    dbService = new DbService();
    await dbService.onModuleInit();

    service = new CartService(dbService);
  });

  afterAll(async () => {
    await dbService.onModuleDestroy();
    await stopDb();
  });

  beforeEach(() => clearTables(db));

  // ── getCart ────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns an empty cart with zero totals when the user has no items', async () => {
      const user = await seedUser(db);

      const result = await service.getCart(user.id);

      expect(result.items).toHaveLength(0);
      expect(result.itemCount).toBe(0);
      expect(result.total).toBe(0);
    });

    it('calculates totals correctly from cart items', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id, { price: '200.00' });
      await seedCartItem(db, user.id, food.id, 2);

      const result = await service.getCart(user.id);
      const expected = calculateCartTotals(400); // 200 * 2

      expect(result.items).toHaveLength(1);
      expect(result.itemCount).toBe(2);
      expect(result.subtotal).toBe(400);
      expect(result.taxes).toBe(expected.taxes);
      expect(result.deliveryFee).toBe(expected.deliveryFee);
      expect(result.total).toBe(expected.total);
    });

    it('uses discounted price when available', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id, {
        price: '300.00',
        discountedPrice: '200.00',
      });
      await seedCartItem(db, user.id, food.id, 1);

      const result = await service.getCart(user.id);

      expect(result.subtotal).toBe(200);
    });
  });

  // ── addToCart ──────────────────────────────────────────────────────────────

  describe('addToCart', () => {
    it('inserts a new cart item and returns it with food details', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id);

      const result = await service.addToCart(user.id, { foodItemId: food.id, quantity: 1 });

      expect(result).toMatchObject({ userId: user.id, foodItemId: food.id, quantity: 1 });
    });

    it('increments quantity when the same item is added again', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id);
      await seedCartItem(db, user.id, food.id, 1);

      const result = await service.addToCart(user.id, { foodItemId: food.id, quantity: 2 });

      expect(result).toMatchObject({ quantity: 3 });
    });

    it('throws NotFoundException when the food item does not exist', async () => {
      const user = await seedUser(db);

      await expect(
        service.addToCart(user.id, { foodItemId: 'nonexistent-id', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the food item is unavailable', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id, { isAvailable: false });

      await expect(
        service.addToCart(user.id, { foodItemId: food.id, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateItem ─────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('updates the quantity of an existing cart item', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id);
      const cartItem = await seedCartItem(db, user.id, food.id, 1);

      const result = await service.updateItem(user.id, cartItem.id, 5);

      expect(result).toMatchObject({ quantity: 5 });
    });

    it('removes the item when quantity is set to 0', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id);
      const cartItem = await seedCartItem(db, user.id, food.id, 3);

      const result = await service.updateItem(user.id, cartItem.id, 0);

      expect(result).toEqual({ removed: true });

      const cart = await service.getCart(user.id);
      expect(cart.items).toHaveLength(0);
    });

    it('throws NotFoundException when the cart item does not belong to the user', async () => {
      const user1 = await seedUser(db, { phone: '9876543210' });
      const user2 = await seedUser(db, { phone: '9123456789' });
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id);
      const cartItem = await seedCartItem(db, user1.id, food.id, 1);

      await expect(
        service.updateItem(user2.id, cartItem.id, 2),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('removes all cart items for the user', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food1 = await seedFoodItem(db, category.id, { name: 'Item 1', slug: 'item-1' });
      const food2 = await seedFoodItem(db, category.id, { name: 'Item 2', slug: 'item-2' });
      await seedCartItem(db, user.id, food1.id, 1);
      await seedCartItem(db, user.id, food2.id, 2);

      const result = await service.clearCart(user.id);

      expect(result).toEqual({ cleared: true });

      const cart = await service.getCart(user.id);
      expect(cart.items).toHaveLength(0);
    });

    it('does not affect other users cart items', async () => {
      const user1 = await seedUser(db, { phone: '9876543210' });
      const user2 = await seedUser(db, { phone: '9123456789' });
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id);
      await seedCartItem(db, user1.id, food.id, 1);
      await seedCartItem(db, user2.id, food.id, 2);

      await service.clearCart(user1.id);

      const cart2 = await service.getCart(user2.id);
      expect(cart2.items).toHaveLength(1);
    });
  });
});
