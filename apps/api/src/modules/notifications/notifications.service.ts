import { Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { notifications } from '../../db/schema';

@Injectable()
export class NotificationsService {
  constructor(private db: DbService) {}

  async createNotification(
    userId: string,
    data: {
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    const [created] = await this.db.db
      .insert(notifications)
      .values({
        userId,
        type: data.type as any,
        title: data.title,
        body: data.body,
        data: data.data ?? {},
      })
      .returning();
    return created;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [items, [{ total }], [{ unread }]] = await Promise.all([
      this.db.db.query.notifications.findMany({
        where: (t, { eq }) => eq(t.userId, userId),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit,
        offset,
      }),
      this.db.db
        .select({ total: sql<number>`count(*)::int` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
      this.db.db
        .select({ unread: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    ]);

    return {
      notifications: items,
      unreadCount: unread,
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

  async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      await this.db.db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    } else {
      await this.db.db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }
    return { success: true };
  }
}
