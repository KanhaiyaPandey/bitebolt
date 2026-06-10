import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DbService } from '../../db/db.service';
import { payments } from '../../db/schema';
import { clearTables, startTestDb, type TestDb } from '../../test/db-helper';
import {
  seedAddress,
  seedCartItem,
  seedCategory,
  seedFoodItem,
  seedOrder,
  seedUser,
  seedWallet,
} from '../../test/fixtures';
import type { NotificationsService } from '../notifications/notifications.service';

import { OrdersService } from './orders.service';

const mockNotifications = {
  createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
} as unknown as NotificationsService;

describe('OrdersService (integration)', () => {
  let db: TestDb;
  let stopDb: () => Promise<void>;
  let dbService: DbService;
  let service: OrdersService;

  beforeAll(async () => {
    ({ db, stop: stopDb } = await startTestDb());

    dbService = new DbService();
    await dbService.onModuleInit();

    service = new OrdersService(dbService, mockNotifications);
  });

  afterAll(async () => {
    await dbService.onModuleDestroy();
    await stopDb();
  });

  beforeEach(async () => {
    await clearTables(db);
    jest.clearAllMocks();
  });

  // ── placeOrder ─────────────────────────────────────────────────────────────

  describe('placeOrder', () => {
    it('throws BadRequestException when the cart is empty', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);

      await expect(
        service.placeOrder(user.id, { addressId: address.id, paymentMethod: 'COD' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when a cart item is unavailable', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id, { isAvailable: false });
      await seedCartItem(db, user.id, food.id, 1);

      await expect(
        service.placeOrder(user.id, { addressId: address.id, paymentMethod: 'COD' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the address does not exist', async () => {
      const user = await seedUser(db);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id);
      await seedCartItem(db, user.id, food.id, 1);

      await expect(
        service.placeOrder(user.id, {
          addressId: 'non-existent-address-id',
          paymentMethod: 'COD',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the order, order items, status history and clears the cart', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id, { price: '250.00' });
      await seedCartItem(db, user.id, food.id, 2);

      const order = await service.placeOrder(user.id, {
        addressId: address.id,
        paymentMethod: 'COD',
      });

      expect(order!.userId).toBe(user.id);
      expect(order!.status).toBe('PENDING');
      expect(order!.items).toHaveLength(1);
      expect(order!.items[0].quantity).toBe(2);

      // Cart must be emptied
      const remaining = await db.query.cartItems.findMany({
        where: (t, { eq }) => eq(t.userId, user.id),
      });
      expect(remaining).toHaveLength(0);

      // Notification must be sent
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ type: 'ORDER_UPDATE' }),
      );
    });

    it('deducts wallet balance when walletAmountToUse is provided', async () => {
      const user = await seedUser(db);
      await seedWallet(db, user.id, '500.00');
      const address = await seedAddress(db, user.id);
      const category = await seedCategory(db);
      const food = await seedFoodItem(db, category.id, { price: '200.00' });
      await seedCartItem(db, user.id, food.id, 1);

      await service.placeOrder(user.id, {
        addressId: address.id,
        paymentMethod: 'WALLET',
        walletAmountToUse: 100,
      });

      const wallet = await db.query.wallets.findFirst({
        where: (t, { eq }) => eq(t.userId, user.id),
      });
      expect(Number(wallet!.balance)).toBe(400);
    });
  });

  // ── getUserOrders ──────────────────────────────────────────────────────────

  describe('getUserOrders', () => {
    it('returns empty list with correct meta when user has no orders', async () => {
      const user = await seedUser(db);

      const result = await service.getUserOrders(user.id);

      expect(result.orders).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('returns paginated orders with correct meta', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);

      for (let i = 0; i < 3; i++) {
        await seedOrder(db, user.id, address.id, { orderNumber: `BB-TEST-${i}` });
      }

      const page1 = await service.getUserOrders(user.id, 1, 2);
      expect(page1.orders).toHaveLength(2);
      expect(page1.meta.total).toBe(3);
      expect(page1.meta.totalPages).toBe(2);
      expect(page1.meta.hasNextPage).toBe(true);

      const page2 = await service.getUserOrders(user.id, 2, 2);
      expect(page2.orders).toHaveLength(1);
      expect(page2.meta.hasPreviousPage).toBe(true);
    });
  });

  // ── getOrderById ───────────────────────────────────────────────────────────

  describe('getOrderById', () => {
    it('returns the order with all relations', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id);

      const result = await service.getOrderById(user.id, order.id);

      expect(result.id).toBe(order.id);
      expect(result.deliveryAddress).toBeDefined();
    });

    it('throws NotFoundException when the order does not exist', async () => {
      const user = await seedUser(db);

      await expect(
        service.getOrderById(user.id, 'nonexistent-order-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the order belongs to another user', async () => {
      const user1 = await seedUser(db, { phone: '9876543210' });
      const user2 = await seedUser(db, { phone: '9123456789' });
      const address = await seedAddress(db, user1.id);
      const order = await seedOrder(db, user1.id, address.id);

      await expect(
        service.getOrderById(user2.id, order.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── cancelOrder ───────────────────────────────────────────────────────────

  describe('cancelOrder', () => {
    it('cancels a PENDING order and records status history', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id, { status: 'PENDING' });

      const result = await service.cancelOrder(user.id, order.id);

      expect(result.status).toBe('CANCELLED');
    });

    it('cancels an ACCEPTED order', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id, { status: 'ACCEPTED' });

      const result = await service.cancelOrder(user.id, order.id);

      expect(result.status).toBe('CANCELLED');
    });

    it('throws BadRequestException when the order is already PREPARING', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id, { status: 'PREPARING' });

      await expect(
        service.cancelOrder(user.id, order.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('issues a wallet refund when the payment was captured', async () => {
      const user = await seedUser(db);
      await seedWallet(db, user.id, '0.00');
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id, { status: 'PENDING', total: '300.00' });

      // Insert a captured payment for this order
      await db.insert(payments).values({
        orderId: order.id,
        userId: user.id,
        amount: '300.00',
        method: 'UPI',
        status: 'CAPTURED',
        razorpayOrderId: 'order_test_rp',
      });

      await service.cancelOrder(user.id, order.id);

      const wallet = await db.query.wallets.findFirst({
        where: (t, { eq }) => eq(t.userId, user.id),
      });
      expect(Number(wallet!.balance)).toBe(300);
    });
  });
});
