import { Injectable, Logger } from '@nestjs/common';
import { desc, eq, gte, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { orderItems, orders, payments } from '../../db/schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private db: DbService) {}

  async getOverview() {
    this.logger.debug('[AnalyticsService] getOverview');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      revenueToday,
      totalRevenue,
      pendingOrders,
      deliveredToday,
      totalOrdersAllTime,
    ] = await Promise.all([
      // Orders today
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(gte(orders.createdAt, todayStart))
        .then(([r]) => r?.count ?? 0),

      // Revenue today (only from delivered/accepted orders)
      this.db.db
        .select({ total: sql<string>`coalesce(sum(total), '0')` })
        .from(orders)
        .where(
          sql`${orders.createdAt} >= ${todayStart} AND ${orders.status} NOT IN ('REJECTED', 'CANCELLED')`,
        )
        .then(([r]) => parseFloat(r?.total ?? '0')),

      // Total revenue all time
      this.db.db
        .select({ total: sql<string>`coalesce(sum(total), '0')` })
        .from(orders)
        .where(sql`${orders.status} NOT IN ('REJECTED', 'CANCELLED')`)
        .then(([r]) => parseFloat(r?.total ?? '0')),

      // Pending orders
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.status, 'PENDING'))
        .then(([r]) => r?.count ?? 0),

      // Delivered today
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(sql`${orders.createdAt} >= ${todayStart} AND ${orders.status} = 'DELIVERED'`)
        .then(([r]) => r?.count ?? 0),

      // Total orders all time
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .then(([r]) => r?.count ?? 0),
    ]);

    return {
      ordersToday,
      revenueToday,
      totalRevenue,
      pendingOrders,
      deliveredToday,
      totalOrdersAllTime,
    };
  }

  async getDailySales(days = 7) {
    this.logger.debug('[AnalyticsService] getDailySales', { days });

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await this.db.db
      .select({
        date: sql<string>`date_trunc('day', ${orders.createdAt})::date::text`,
        orderCount: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
      })
      .from(orders)
      .where(
        sql`${orders.createdAt} >= ${since} AND ${orders.status} NOT IN ('REJECTED', 'CANCELLED')`,
      )
      .groupBy(sql`date_trunc('day', ${orders.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})::date`);

    // Fill missing days with zeros
    const result: { date: string; orderCount: number; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = rows.find((r) => r.date === dateStr);
      result.push({
        date: dateStr,
        orderCount: found?.orderCount ?? 0,
        revenue: parseFloat(found?.revenue ?? '0'),
      });
    }

    return result;
  }

  async getPopularItems(limit = 10) {
    this.logger.debug('[AnalyticsService] getPopularItems', { limit });

    const rows = await this.db.db
      .select({
        foodItemId: orderItems.foodItemId,
        name: orderItems.name,
        orderCount: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`coalesce(sum(${orderItems.subtotal}), '0')`,
      })
      .from(orderItems)
      .groupBy(orderItems.foodItemId, orderItems.name)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    const withImages = await Promise.all(
      rows.map(async (row) => {
        const food = await this.db.db.query.foodItems.findFirst({
          where: (t, { eq: eqFn }) => eqFn(t.id, row.foodItemId),
          columns: { imageUrl: true },
        });
        return {
          foodItemId: row.foodItemId,
          name: row.name,
          imageUrl: food?.imageUrl ?? null,
          orderCount: row.orderCount,
          totalRevenue: parseFloat(row.totalRevenue),
        };
      }),
    );

    return withImages;
  }

  async getOrderStats() {
    this.logger.debug('[AnalyticsService] getOrderStats');

    const [statusRows, paymentRows] = await Promise.all([
      this.db.db
        .select({
          status: orders.status,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .groupBy(orders.status),

      this.db.db
        .select({
          method: payments.method,
          count: sql<number>`count(*)::int`,
        })
        .from(payments)
        .where(eq(payments.status, 'CAPTURED'))
        .groupBy(payments.method),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusRows) {
      byStatus[row.status] = row.count;
    }

    const byPaymentMethod: Record<string, number> = {};
    for (const row of paymentRows) {
      byPaymentMethod[row.method] = row.count;
    }

    return { byStatus, byPaymentMethod };
  }
}
