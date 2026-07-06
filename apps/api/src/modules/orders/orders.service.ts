import { calculateCartTotals, generateOrderNumber } from '@bitebolt/utils';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import {
  cartItems,
  orderItems,
  orderStatusHistory,
  orders,
  walletTransactions,
  wallets,
} from '../../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';

import type { PlaceOrderDto } from './dto/place-order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private db: DbService,
    private notifications: NotificationsService,
    private settings: SettingsService,
  ) {}

  // ── Place Order ──────────────────────────────────────────────────────────────

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    const cartRows = await this.db.db.query.cartItems.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      with: { foodItem: true },
    });

    if (!cartRows.length) throw new BadRequestException('Your cart is empty.');

    const unavailable = cartRows.filter((item) => !item.foodItem.isAvailable);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `These items are currently unavailable: ${unavailable.map((i) => i.foodItem.name).join(', ')}`,
      );
    }

    const address = await this.db.db.query.addresses.findFirst({
      where: (t, { and, eq }) => and(eq(t.id, dto.addressId), eq(t.userId, userId)),
    });
    if (!address) throw new NotFoundException('Delivery address not found.');

    const subtotal = cartRows.reduce(
      (sum, item) =>
        sum + Number(item.foodItem.discountedPrice ?? item.foodItem.price) * item.quantity,
      0,
    );
    const fee = await this.settings.getDeliveryFee();
    const { taxes, deliveryFee, total } = calculateCartTotals(subtotal, fee);

    let walletAmountUsed = 0;
    if (dto.walletAmountToUse && dto.walletAmountToUse > 0) {
      const wallet = await this.db.db.query.wallets.findFirst({
        where: (t, { eq }) => eq(t.userId, userId),
      });
      if (!wallet) throw new BadRequestException('Wallet not found.');
      walletAmountUsed = Math.min(dto.walletAmountToUse, Number(wallet.balance), total);
    }

    const order = await this.db.db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber: generateOrderNumber(),
          userId,
          addressId: dto.addressId,
          subtotal: String(subtotal),
          deliveryFee: String(deliveryFee),
          taxes: String(taxes),
          total: String(total),
          specialInstructions: dto.specialInstructions,
        })
        .returning();

      await tx.insert(orderItems).values(
        cartRows.map((item) => ({
          orderId: newOrder.id,
          foodItemId: item.foodItemId,
          name: item.foodItem.name,
          price: String(Number(item.foodItem.discountedPrice ?? item.foodItem.price)),
          quantity: item.quantity,
          subtotal: String(
            Number(item.foodItem.discountedPrice ?? item.foodItem.price) * item.quantity,
          ),
          specialInstructions: item.specialInstructions,
        })),
      );

      await tx.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        status: 'PENDING',
        notes: 'Order placed by customer',
      });

      if (walletAmountUsed > 0) {
        const [wallet] = await tx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} - ${walletAmountUsed}::numeric` })
          .where(eq(wallets.userId, userId))
          .returning();

        await tx.insert(walletTransactions).values({
          walletId: wallet.id,
          orderId: newOrder.id,
          type: 'DEBIT',
          reason: 'ORDER_PAYMENT',
          amount: String(walletAmountUsed),
          balanceAfter: wallet.balance,
          description: `Payment for order ${newOrder.orderNumber}`,
          referenceId: newOrder.id,
        });
      }

      await tx.delete(cartItems).where(eq(cartItems.userId, userId));

      return tx.query.orders.findFirst({
        where: (t, { eq }) => eq(t.id, newOrder.id),
        with: {
          items: {
            with: {
              foodItem: { columns: { id: true, name: true, imageUrl: true, isVeg: true } },
            },
          },
          deliveryAddress: true,
        },
      });
    });

    await this.notifications.createNotification(userId, {
      type: 'ORDER_UPDATE',
      title: '🎉 Order Placed!',
      body: `Your order ${order!.orderNumber} has been placed successfully.`,
      data: { orderId: order!.id, orderNumber: order!.orderNumber },
    });

    return order;
  }

  // ── Get User Orders ──────────────────────────────────────────────────────────

  async getUserOrders(userId: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [orderList, [{ total }]] = await Promise.all([
      this.db.db.query.orders.findMany({
        where: (t, { eq }) => eq(t.userId, userId),
        with: {
          items: {
            with: {
              foodItem: { columns: { id: true, name: true, imageUrl: true, isVeg: true } },
            },
          },
          deliveryAddress: true,
          payment: { columns: { method: true, status: true } },
        },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit,
        offset,
      }),
      this.db.db
        .select({ total: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.userId, userId)),
    ]);

    return {
      orders: orderList,
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

  // ── Get Order by ID ──────────────────────────────────────────────────────────

  async getOrderById(userId: string, orderId: string) {
    const order = await this.db.db.query.orders.findFirst({
      where: (t, { and, eq }) => and(eq(t.id, orderId), eq(t.userId, userId)),
      with: {
        items: {
          with: {
            foodItem: { columns: { id: true, name: true, imageUrl: true, isVeg: true } },
          },
        },
        deliveryAddress: true,
        payment: true,
        statusHistory: { orderBy: (t, { asc }) => [asc(t.createdAt)] },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  // ── Cancel Order ─────────────────────────────────────────────────────────────

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.db.db.query.orders.findFirst({
      where: (t, { and, eq }) => and(eq(t.id, orderId), eq(t.userId, userId)),
    });
    if (!order) throw new NotFoundException('Order not found.');

    const cancellableStatuses = ['PENDING', 'ACCEPTED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException('This order can no longer be cancelled.');
    }

    const updated = await this.db.db.transaction(async (tx) => {
      const [cancelled] = await tx
        .update(orders)
        .set({ status: 'CANCELLED' })
        .where(eq(orders.id, orderId))
        .returning();

      await tx.insert(orderStatusHistory).values({
        orderId,
        status: 'CANCELLED',
        notes: 'Cancelled by customer',
      });

      const payment = await tx.query.payments.findFirst({
        where: (t, { eq }) => eq(t.orderId, orderId),
      });

      if (payment && payment.status === 'CAPTURED') {
        const [wallet] = await tx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} + ${Number(order.total)}::numeric` })
          .where(eq(wallets.userId, userId))
          .returning();

        if (wallet) {
          await tx.insert(walletTransactions).values({
            walletId: wallet.id,
            orderId,
            type: 'CREDIT',
            reason: 'ORDER_REFUND',
            amount: order.total,
            balanceAfter: wallet.balance,
            description: `Refund for cancelled order ${order.orderNumber}`,
            referenceId: orderId,
          });
        }
      }

      return cancelled;
    });

    await this.notifications.createNotification(userId, {
      type: 'ORDER_UPDATE',
      title: 'Order Cancelled',
      body: `Your order ${order.orderNumber} has been cancelled.`,
      data: { orderId: order.id },
    });

    return updated;
  }

  // ── Admin: Get All Orders ─────────────────────────────────────────────────────

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const where = status ? eq(orders.status, status as any) : undefined;

    const [orderList, [{ total }]] = await Promise.all([
      this.db.db.query.orders.findMany({
        where: where ? () => where : undefined,
        with: {
          user: { columns: { id: true, name: true, phone: true } },
          items: true,
          deliveryAddress: true,
          payment: { columns: { method: true, status: true, amount: true } },
        },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit,
        offset,
      }),
      this.db.db
        .select({ total: sql<number>`count(*)::int` })
        .from(orders)
        .where(where),
    ]);

    return {
      orders: orderList,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Admin: Get Order by ID ───────────────────────────────────────────────────

  async getOrderByIdForAdmin(orderId: string) {
    const order = await this.db.db.query.orders.findFirst({
      where: (t, { eq }) => eq(t.id, orderId),
      with: {
        items: {
          with: {
            foodItem: { columns: { id: true, name: true, imageUrl: true, isVeg: true } },
          },
        },
        deliveryAddress: true,
        payment: true,
        statusHistory: { orderBy: (t, { asc }) => [asc(t.createdAt)] },
        user: { columns: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  // ── Admin: Update Order Status ────────────────────────────────────────────────

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.db.db.query.orders.findFirst({
      where: (t, { eq }) => eq(t.id, orderId),
    });
    if (!order) throw new NotFoundException('Order not found.');

    const [updated] = await this.db.db
      .update(orders)
      .set({
        status: dto.status as any,
        estimatedDeliveryTime: dto.estimatedDeliveryTime,
        rejectionReason: dto.rejectionReason,
      })
      .where(eq(orders.id, orderId))
      .returning();

    await this.db.db.insert(orderStatusHistory).values({
      orderId,
      status: dto.status as any,
      notes: dto.notes,
    });

    const statusMessages: Record<string, string> = {
      ACCEPTED: 'Your order has been accepted and will be prepared shortly.',
      REJECTED: `Your order was rejected. ${dto.rejectionReason ?? ''}`,
      PREPARING: 'We are now preparing your delicious meal!',
      OUT_FOR_DELIVERY: 'Your order is out for delivery!',
      DELIVERED: 'Your order has been delivered. Enjoy your meal!',
    };

    if (statusMessages[dto.status]) {
      await this.notifications.createNotification(order.userId, {
        type: 'ORDER_UPDATE',
        title: 'Order Update',
        body: statusMessages[dto.status],
        data: { orderId, status: dto.status },
      });
    }

    return updated;
  }
}
