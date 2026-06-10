import * as crypto from 'crypto';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { http, HttpResponse } from 'msw';

import { DbService } from '../../db/db.service';
import { payments } from '../../db/schema';
import { clearTables, startTestDb, type TestDb } from '../../test/db-helper';
import { seedAddress, seedOrder, seedUser } from '../../test/fixtures';
import { mswServer } from '../../test/msw-server';

import { PaymentsService } from './payments.service';

const KEY_SECRET = 'test-razorpay-key-secret';
const WEBHOOK_SECRET = 'test-razorpay-webhook-secret';

const mockConfigService = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      'razorpay.keyId': 'rzp_test_key_id',
      'razorpay.keySecret': KEY_SECRET,
      'razorpay.webhookSecret': WEBHOOK_SECRET,
    };
    return map[key];
  }),
} as unknown as ConfigService;

function sign(data: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

describe('PaymentsService (integration)', () => {
  let db: TestDb;
  let stopDb: () => Promise<void>;
  let dbService: DbService;
  let service: PaymentsService;

  beforeAll(async () => {
    ({ db, stop: stopDb } = await startTestDb());

    dbService = new DbService();
    await dbService.onModuleInit();

    service = new PaymentsService(dbService, mockConfigService);
  });

  afterAll(async () => {
    await dbService.onModuleDestroy();
    await stopDb();
  });

  beforeEach(() => clearTables(db));

  // ── createRazorpayOrder ───────────────────────────────────────────────────

  describe('createRazorpayOrder', () => {
    it('calls Razorpay API (via MSW) and inserts a payment record', async () => {
      let razorpayWasCalled = false;
      mswServer.use(
        http.post('https://api.razorpay.com/v1/orders', async ({ request }) => {
          razorpayWasCalled = true;
          const body = (await request.json()) as { amount: number; receipt: string };
          return HttpResponse.json({
            id: 'order_rp_integration_test',
            amount: body.amount,
            currency: 'INR',
            receipt: body.receipt,
            status: 'created',
          });
        }),
      );

      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id, { total: '303.00' });

      const result = await service.createRazorpayOrder(user.id, {
        orderId: order.id,
        method: 'UPI',
      });

      expect(razorpayWasCalled).toBe(true);
      expect(result.razorpayOrderId).toBe('order_rp_integration_test');
      expect(result.currency).toBe('INR');
      expect(result.keyId).toBe('rzp_test_key_id');

      const payment = await db.query.payments.findFirst({
        where: (t, { eq }) => eq(t.orderId, order.id),
      });
      expect(payment).toBeDefined();
      expect(payment!.status).toBe('PENDING');
    });

    it('subtracts wallet amount from total before charging Razorpay', async () => {
      let capturedAmount = 0;
      mswServer.use(
        http.post('https://api.razorpay.com/v1/orders', async ({ request }) => {
          const body = (await request.json()) as { amount: number };
          capturedAmount = body.amount;
          return HttpResponse.json({
            id: 'order_rp_wallet',
            amount: body.amount,
            currency: 'INR',
            receipt: 'receipt',
            status: 'created',
          });
        }),
      );

      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id, { total: '303.00' });

      await service.createRazorpayOrder(user.id, {
        orderId: order.id,
        method: 'UPI',
        walletAmountUsed: 100,
      });

      // 303 - 100 = 203 rupees → 20300 paise
      expect(capturedAmount).toBe(20300);
    });

    it('throws NotFoundException when the order does not exist', async () => {
      const user = await seedUser(db);

      await expect(
        service.createRazorpayOrder(user.id, { orderId: 'nonexistent-order', method: 'UPI' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the order has already been paid', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id);

      await db.insert(payments).values({
        orderId: order.id,
        userId: user.id,
        amount: '303.00',
        method: 'UPI',
        status: 'CAPTURED',
        razorpayOrderId: 'order_already_paid',
      });

      await expect(
        service.createRazorpayOrder(user.id, { orderId: order.id, method: 'UPI' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── verifyPayment ──────────────────────────────────────────────────────────

  describe('verifyPayment', () => {
    async function createPendingPayment(userId: string, orderId: string) {
      const [payment] = await db
        .insert(payments)
        .values({
          orderId,
          userId,
          amount: '303.00',
          method: 'UPI',
          status: 'PENDING',
          razorpayOrderId: 'order_rp_verify_test',
        })
        .returning();
      return payment;
    }

    it('captures payment and sets order to ACCEPTED on valid signature', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id);
      await createPendingPayment(user.id, order.id);

      const razorpayOrderId = 'order_rp_verify_test';
      const razorpayPaymentId = 'pay_test_valid_123';
      const signature = sign(`${razorpayOrderId}|${razorpayPaymentId}`, KEY_SECRET);

      const result = await service.verifyPayment(user.id, {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
      });

      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();

      const updatedOrder = await db.query.orders.findFirst({
        where: (t, { eq }) => eq(t.id, order.id),
      });
      expect(updatedOrder!.status).toBe('ACCEPTED');
    });

    it('throws BadRequestException for an invalid signature', async () => {
      const user = await seedUser(db);

      await expect(
        service.verifyPayment(user.id, {
          razorpayOrderId: 'order_rp_bad',
          razorpayPaymentId: 'pay_bad',
          razorpaySignature: 'definitely-wrong-signature',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when no payment record matches the Razorpay order', async () => {
      const user = await seedUser(db);

      const razorpayOrderId = 'order_rp_no_record';
      const razorpayPaymentId = 'pay_no_record';
      const signature = sign(`${razorpayOrderId}|${razorpayPaymentId}`, KEY_SECRET);

      await expect(
        service.verifyPayment(user.id, {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: signature,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── handleWebhook ──────────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('marks payment as FAILED on payment.failed event', async () => {
      const user = await seedUser(db);
      const address = await seedAddress(db, user.id);
      const order = await seedOrder(db, user.id, address.id);
      await db.insert(payments).values({
        orderId: order.id,
        userId: user.id,
        amount: '303.00',
        method: 'UPI',
        status: 'PENDING',
        razorpayOrderId: 'order_rp_webhook_test',
      });

      const payload = JSON.stringify({
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              order_id: 'order_rp_webhook_test',
              error_description: 'Insufficient funds',
            },
          },
        },
      });
      const signature = sign(payload, WEBHOOK_SECRET);

      const result = await service.handleWebhook(payload, signature);

      expect(result).toEqual({ received: true });

      const payment = await db.query.payments.findFirst({
        where: (t, { eq }) => eq(t.razorpayOrderId, 'order_rp_webhook_test'),
      });
      expect(payment!.status).toBe('FAILED');
      expect(payment!.failureReason).toBe('Insufficient funds');
    });

    it('throws BadRequestException for an invalid webhook signature', async () => {
      const payload = JSON.stringify({ event: 'payment.captured' });

      await expect(service.handleWebhook(payload, 'bad-signature')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
