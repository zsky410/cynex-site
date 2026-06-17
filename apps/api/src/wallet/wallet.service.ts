import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma } from "@cynex/db";
import { PrismaService } from "../prisma/prisma.service";
import type { WalletTransactionType } from "@cynex/shared";

type Tx = Prisma.TransactionClient;

interface DeltaOpts {
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdByAdminId?: string;
}

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  // Core money mutation. `delta` is signed (+credit, -debit). Always writes a
  // wallet_transactions row and never lets the balance go negative (PRD 13.2).
  // MUST be called inside a DB transaction so balance + ledger stay atomic.
  async applyDelta(
    tx: Tx,
    userId: string,
    delta: number,
    type: WalletTransactionType,
    opts: DeltaOpts = {},
  ): Promise<number> {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { walletBalance: true },
    });
    const before = user.walletBalance;
    const after = before + delta;
    if (after < 0) throw new BadRequestException("Số dư ví không đủ");

    await tx.user.update({ where: { id: userId }, data: { walletBalance: after } });
    await tx.walletTransaction.create({
      data: {
        userId,
        type,
        amount: delta,
        balanceBefore: before,
        balanceAfter: after,
        referenceType: opts.referenceType,
        referenceId: opts.referenceId,
        description: opts.description,
        createdByAdminId: opts.createdByAdminId,
      },
    });
    return after;
  }

  credit(tx: Tx, userId: string, amount: number, type: WalletTransactionType, opts: DeltaOpts = {}) {
    return this.applyDelta(tx, userId, Math.abs(amount), type, opts);
  }

  debit(tx: Tx, userId: string, amount: number, type: WalletTransactionType, opts: DeltaOpts = {}) {
    return this.applyDelta(tx, userId, -Math.abs(amount), type, opts);
  }

  getBalance(userId: string) {
    return this.prisma.user
      .findUniqueOrThrow({ where: { id: userId }, select: { walletBalance: true } })
      .then((u) => u.walletBalance);
  }

  listTransactions(userId: string, take = 50) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}
