import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { addresses, users } from '../../db/schema';

@Injectable()
export class UsersService {
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
      where: (t, { and, eq }) => and(eq(t.id, addressId), eq(t.userId, userId)),
    });
    if (!existing) throw new NotFoundException('Address not found.');

    await this.db.db.delete(addresses).where(eq(addresses.id, addressId));
    return { deleted: true };
  }
}
