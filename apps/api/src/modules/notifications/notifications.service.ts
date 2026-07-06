import { Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { notifications, users } from '../../db/schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

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

    this.sendPush(userId, data.title, data.body, data.data).catch((err) =>
      this.logger.warn(`Push send failed for user ${userId}: ${err.message}`),
    );

    return created;
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const [user] = await this.db.db
      .select({ fcmToken: users.fcmToken })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.fcmToken?.startsWith('ExponentPushToken')) return;

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.fcmToken,
        title,
        body,
        data: data ?? {},
        sound: 'default',
      }),
    });

    if (!response.ok) {
      this.logger.warn(`Expo push responded with ${response.status} for user ${userId}`);
    }
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
