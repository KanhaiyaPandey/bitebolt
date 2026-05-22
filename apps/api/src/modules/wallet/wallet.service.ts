import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DbService } from '../../db/db.service';
import { walletTransactions, wallets } from '../../db/schema';

@Injectable()
export class WalletService {
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
}
