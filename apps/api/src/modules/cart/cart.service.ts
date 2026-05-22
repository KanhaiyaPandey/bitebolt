import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { calculateCartTotals } from '@bitebolt/utils';

import { DbService } from '../../db/db.service';
import { cartItems, foodItems } from '../../db/schema';

@Injectable()
export class CartService {
  constructor(private db: DbService) {}

  async getCart(userId: string) {
    const items = await this.db.db.query.cartItems.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      with: {
        foodItem: {
          with: { category: { columns: { id: true, name: true } } },
        },
      },
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    const subtotal = items.reduce(
      (sum, item) =>
        sum + Number(item.foodItem.discountedPrice ?? item.foodItem.price) * item.quantity,
      0,
    );

    const { taxes, deliveryFee, total } = calculateCartTotals(subtotal);

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      deliveryFee,
      taxes,
      total,
    };
  }

  async addToCart(
    userId: string,
    data: { foodItemId: string; quantity: number; specialInstructions?: string },
  ) {
    const food = await this.db.db.query.foodItems.findFirst({
      where: (t, { eq }) => eq(t.id, data.foodItemId),
    });
    if (!food || !food.isAvailable) {
      throw new NotFoundException('Food item not found or unavailable.');
    }

    const existing = await this.db.db.query.cartItems.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.userId, userId), eq(t.foodItemId, data.foodItemId)),
    });

    if (existing) {
      const [updated] = await this.db.db
        .update(cartItems)
        .set({
          quantity: existing.quantity + data.quantity,
          specialInstructions: data.specialInstructions ?? existing.specialInstructions,
        })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return this.db.db.query.cartItems.findFirst({
        where: (t, { eq }) => eq(t.id, updated.id),
        with: { foodItem: true },
      });
    }

    const [created] = await this.db.db
      .insert(cartItems)
      .values({ userId, ...data })
      .returning();
    return this.db.db.query.cartItems.findFirst({
      where: (t, { eq }) => eq(t.id, created.id),
      with: { foodItem: true },
    });
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await this.db.db.query.cartItems.findFirst({
      where: (t, { and, eq }) => and(eq(t.id, itemId), eq(t.userId, userId)),
    });
    if (!item) throw new NotFoundException('Cart item not found.');

    if (quantity === 0) {
      await this.db.db.delete(cartItems).where(eq(cartItems.id, itemId));
      return { removed: true };
    }

    const [updated] = await this.db.db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId))
      .returning();
    return this.db.db.query.cartItems.findFirst({
      where: (t, { eq }) => eq(t.id, updated.id),
      with: { foodItem: true },
    });
  }

  async clearCart(userId: string) {
    await this.db.db.delete(cartItems).where(eq(cartItems.userId, userId));
    return { cleared: true };
  }
}
