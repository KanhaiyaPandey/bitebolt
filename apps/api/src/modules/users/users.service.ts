import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { addresses, orders, users } from '../../db/schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private db: DbService) {}

  async getProfile(userId: string) {
    const user = await this.db.db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, userId),
      with: {
        addresses: { orderBy: (a, { desc }) => [desc(a.isDefault)] },
        wallet: { columns: { balance: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updatePushToken(userId: string, token: string | null) {
    await this.db.db.update(users).set({ fcmToken: token }).where(eq(users.id, userId));
    return { success: true };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    if (data.email) {
      const [exists] = await this.db.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, data.email), ne(users.id, userId)));
      if (exists) throw new BadRequestException('Email already in use.');
    }

    const [updated] = await this.db.db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        phone: users.phone,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
      });
    return updated;
  }

  async getAddresses(userId: string) {
    return this.db.db.query.addresses.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      orderBy: (t, { desc }) => [desc(t.isDefault), desc(t.createdAt)],
    });
  }

  async addAddress(
    userId: string,
    data: {
      label: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.db.db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
    }

    const [created] = await this.db.db
      .insert(addresses)
      .values({ userId, ...data })
      .returning();
    return created;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<{
      label: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      pincode: string;
      isDefault: boolean;
    }>,
  ) {
    const existing = await this.db.db.query.addresses.findFirst({
      where: (t, { and, eq }) => and(eq(t.id, addressId), eq(t.userId, userId)),
    });
    if (!existing) throw new NotFoundException('Address not found.');

    if (data.isDefault) {
      await this.db.db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
    }

    const [updated] = await this.db.db
      .update(addresses)
      .set(data)
      .where(eq(addresses.id, addressId))
      .returning();
    return updated;
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.db.db.query.addresses.findFirst({
      where: (t, { and: andFn, eq: eqFn }) => andFn(eqFn(t.id, addressId), eqFn(t.userId, userId)),
    });
    if (!existing) throw new NotFoundException('Address not found.');

    await this.db.db.delete(addresses).where(eq(addresses.id, addressId));
    return { deleted: true };
  }

  // ── Admin: List Customers ─────────────────────────────────────────────────────

  async getCustomers(page = 1, limit = 20, search?: string) {
    this.logger.debug('[UsersService] getCustomers', { page, limit, search });
    const offset = (page - 1) * limit;

    const searchFilter = search
      ? or(
          ilike(users.name, `%${search}%`),
          ilike(users.phone, `%${search}%`),
          ilike(users.email!, `%${search}%`),
        )
      : undefined;

    const roleFilter = eq(users.role, 'CUSTOMER');
    const where = searchFilter ? and(roleFilter, searchFilter) : roleFilter;

    const customerList = await this.db.db.query.users.findMany({
      where: () => where!,
      columns: { id: true, name: true, phone: true, email: true, isActive: true, createdAt: true },
      orderBy: (t, { desc: descFn }) => [descFn(t.createdAt)],
      limit,
      offset,
    });

    const [{ total }] = await this.db.db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(where);

    const withStats = await Promise.all(
      customerList.map(async (customer) => {
        const [stats] = await this.db.db
          .select({
            orderCount: sql<number>`count(*)::int`,
            totalSpent: sql<string>`coalesce(sum(total), '0')`,
          })
          .from(orders)
          .where(
            and(
              eq(orders.userId, customer.id),
              sql`${orders.status} NOT IN ('REJECTED', 'CANCELLED')`,
            ),
          );
        return {
          ...customer,
          orderCount: stats?.orderCount ?? 0,
          totalSpent: parseFloat(stats?.totalSpent ?? '0'),
        };
      }),
    );

    return {
      customers: withStats,
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

  // ── Admin: Get Customer by ID ─────────────────────────────────────────────────

  async getCustomerById(id: string) {
    this.logger.debug('[UsersService] getCustomerById', { id });

    const customer = await this.db.db.query.users.findFirst({
      where: (t, { eq: eqFn }) => eqFn(t.id, id),
      with: {
        addresses: { orderBy: (a, { desc: descFn }) => [descFn(a.isDefault)] },
        wallet: { columns: { balance: true } },
        orders: {
          orderBy: (o, { desc: descFn }) => [descFn(o.createdAt)],
          with: {
            items: true,
            payment: { columns: { method: true, status: true, amount: true } },
          },
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found.');
    return customer;
  }
}
