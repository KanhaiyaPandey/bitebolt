import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { walletTransactions, wallets } from '../../db/schema';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private db: DbService) {}

  async getWallet(userId: string) {
    const wallet = await this.db.db.query.wallets.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
      with: {
        transactions: {
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          limit: 20,
        },
      },
    });

    if (!wallet) throw new NotFoundException('Wallet not found.');
    return wallet;
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.db.db.query.wallets.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    });
    if (!wallet) throw new NotFoundException('Wallet not found.');

    const offset = (page - 1) * limit;

    const [transactions, [{ total }]] = await Promise.all([
      this.db.db.query.walletTransactions.findMany({
        where: (t, { eq }) => eq(t.walletId, wallet.id),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit,
        offset,
      }),
      this.db.db
        .select({ total: sql<number>`count(*)::int` })
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id)),
    ]);

    return {
      balance: Number(wallet.balance),
      transactions,
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

  async topUp(userId: string, amount: number, referenceId: string) {
    if (amount <= 0 || amount > 10000) {
      throw new BadRequestException('Amount must be between ₹1 and ₹10,000.');
    }

    const wallet = await this.db.db.query.wallets.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    });
    if (!wallet) throw new NotFoundException('Wallet not found.');

    const updated = await this.db.db.transaction(async (tx) => {
      const [updatedWallet] = await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${amount}::numeric` })
        .where(eq(wallets.userId, userId))
        .returning();

      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        type: 'CREDIT',
        reason: 'TOP_UP',
        amount: String(amount),
        balanceAfter: updatedWallet.balance,
        description: `Wallet top-up of ₹${amount}`,
        referenceId,
      });

      return updatedWallet;
    });

    return { balance: Number(updated.balance), added: amount };
  }

  // ── Admin: All Wallet Transactions ───────────────────────────────────────────

  async getAllTransactions(page = 1, limit = 20, userId?: string, type?: string) {
    this.logger.debug('[WalletService] getAllTransactions', { page, limit, userId, type });
    const offset = (page - 1) * limit;

    // Transactions are keyed by wallet, so resolve the user's wallet to filter by userId.
    let walletId: string | undefined;
    if (userId) {
      const wallet = await this.db.db.query.wallets.findFirst({
        where: (t, { eq: eqFn }) => eqFn(t.userId, userId),
        columns: { id: true },
      });
      if (!wallet) {
        return {
          transactions: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
        };
      }
      walletId = wallet.id;
    }

    const rows = await this.db.db.query.walletTransactions.findMany({
      where: (t, { and: andFn, eq: eqFn }) => {
        const conditions = [];
        if (walletId) conditions.push(eqFn(t.walletId, walletId));
        if (type) conditions.push(eqFn(t.type, type as 'CREDIT' | 'DEBIT'));
        return conditions.length > 0 ? andFn(...(conditions as [any, ...any[]])) : undefined;
      },
      orderBy: (t, { desc: descFn }) => [descFn(t.createdAt)],
      limit,
      offset,
      with: { wallet: { with: { user: { columns: { id: true, name: true, phone: true } } } } },
    });

    const countConditions = [];
    if (walletId) countConditions.push(eq(walletTransactions.walletId, walletId));
    if (type) countConditions.push(eq(walletTransactions.type, type as 'CREDIT' | 'DEBIT'));

    const [{ total }] = await this.db.db
      .select({ total: sql<number>`count(*)::int` })
      .from(walletTransactions)
      .where(countConditions.length > 0 ? and(...countConditions) : undefined);

    const mapped = rows.map((tx) => ({
      id: tx.id,
      type: tx.type,
      reason: tx.reason,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      description: tx.description,
      orderId: tx.orderId,
      createdAt: tx.createdAt,
      userId: tx.wallet.userId,
      userName: tx.wallet.user?.name ?? tx.wallet.user?.phone ?? 'Unknown',
      userPhone: tx.wallet.user?.phone ?? '',
    }));

    return {
      transactions: mapped,
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
