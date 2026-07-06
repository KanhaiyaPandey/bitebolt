import * as crypto from 'crypto';

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql } from 'drizzle-orm';
import Razorpay from 'razorpay';

import { DbService } from '../../db/db.service';
import { orderStatusHistory, orders, payments } from '../../db/schema';

import type { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import type { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay | null = null;

  constructor(
    private db: DbService,
    private configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('razorpay.keyId');
    const keySecret = this.configService.get<string>('razorpay.keySecret');
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn('Razorpay keys not configured — payment endpoints will be unavailable');
    }
  }

  private getRazorpay(): Razorpay {
    if (!this.razorpay) throw new BadRequestException('Razorpay is not configured on this server.');
    return this.razorpay;
  }

  // ── Create Razorpay Order ────────────────────────────────────────────────────

  async createRazorpayOrder(userId: string, dto: CreateRazorpayOrderDto) {
    const order = await this.db.db.query.orders.findFirst({
      where: (t, { and, eq }) => and(eq(t.id, dto.orderId), eq(t.userId, userId)),
    });
    if (!order) throw new NotFoundException('Order not found.');

    const existingPayment = await this.db.db.query.payments.findFirst({
      where: (t, { eq }) => eq(t.orderId, dto.orderId),
    });
    if (existingPayment?.status === 'CAPTURED') {
      throw new BadRequestException('This order has already been paid.');
    }

    const amountToPay = Number(order.total) - (dto.walletAmountUsed ?? 0);
    const amountInPaise = Math.round(amountToPay * 100);

    const razorpayOrder = await this.getRazorpay().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id, userId },
    });

    if (existingPayment) {
      await this.db.db
        .update(payments)
        .set({
          razorpayOrderId: razorpayOrder.id,
          amount: String(amountToPay),
          method: dto.method as any,
          walletAmountUsed: String(dto.walletAmountUsed ?? 0),
        })
        .where(eq(payments.orderId, dto.orderId));
    } else {
      await this.db.db.insert(payments).values({
        orderId: dto.orderId,
        userId,
        amount: String(amountToPay),
        method: dto.method as any,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
        walletAmountUsed: String(dto.walletAmountUsed ?? 0),
      });
    }

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: this.configService.get('razorpay.keyId'),
    };
  }

  // ── Verify Payment ───────────────────────────────────────────────────────────

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get<string>('razorpay.keySecret')!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Payment signature verification failed.');
    }

    const payment = await this.db.db.query.payments.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.razorpayOrderId, dto.razorpayOrderId), eq(t.userId, userId)),
    });
    if (!payment) throw new NotFoundException('Payment record not found.');

    const updatedPayment = await this.db.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(payments)
        .set({
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          status: 'CAPTURED',
        })
        .where(eq(payments.id, payment.id))
        .returning();

      await tx.update(orders).set({ status: 'ACCEPTED' }).where(eq(orders.id, payment.orderId));

      await tx.insert(orderStatusHistory).values({
        orderId: payment.orderId,
        status: 'ACCEPTED',
        notes: 'Payment captured successfully',
      });

      return updated;
    });

    return { success: true, paymentId: updatedPayment.id };
  }

  // ── Razorpay Webhook ─────────────────────────────────────────────────────────

  async handleWebhook(payload: string, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get<string>('razorpay.webhookSecret')!)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    const event = JSON.parse(payload);
    this.logger.log(`Razorpay webhook: ${event.event}`);

    if (event.event === 'payment.failed') {
      const razorpayOrderId = event.payload?.payment?.entity?.order_id;
      if (razorpayOrderId) {
        await this.db.db
          .update(payments)
          .set({
            status: 'FAILED',
            failureReason: event.payload?.payment?.entity?.error_description,
          })
          .where(eq(payments.razorpayOrderId, razorpayOrderId));
      }
    }

    return { received: true };
  }

  // ── Admin: All Payments ──────────────────────────────────────────────────────

  async getAllPayments(page = 1, limit = 20, status?: string, method?: string) {
    this.logger.debug('[PaymentsService] getAllPayments', { page, limit, status, method });
    const offset = (page - 1) * limit;

    const rows = await this.db.db.query.payments.findMany({
      where: (t, { and: andFn, eq: eqFn }) => {
        const conditions: ReturnType<typeof eqFn>[] = [];
        if (status) conditions.push(eqFn(t.status, status as any));
        if (method) conditions.push(eqFn(t.method, method as any));
        return conditions.length > 0 ? andFn(...(conditions as [any, ...any[]])) : undefined;
      },
      orderBy: (t, { desc: descFn }) => [descFn(t.createdAt)],
      limit,
      offset,
      with: {
        order: { columns: { id: true, orderNumber: true, total: true } },
        user: { columns: { id: true, name: true, phone: true } },
      },
    });

    const [{ total }] = await this.db.db
      .select({ total: sql<number>`count(*)::int` })
      .from(payments);

    return {
      payments: rows,
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
}
