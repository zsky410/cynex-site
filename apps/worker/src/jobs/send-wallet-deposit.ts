import { EMAIL_JOB, EmailType } from "@cynex/shared";
import { registerHandler } from "../handlers";
import { deliverEmail } from "../email/deliver";
import { walletDepositEmail } from "../email/templates";

registerHandler(EMAIL_JOB.walletDeposit, async (job) => {
  const d = job.data as {
    toEmail: string;
    userId?: string;
    amount: number;
    balanceAfter: number;
    paymentCode: string;
  };
  const { subject, html } = walletDepositEmail({
    amount: d.amount,
    balanceAfter: d.balanceAfter,
    paymentCode: d.paymentCode,
  });
  await deliverEmail({
    type: EmailType.wallet_deposit_confirmed,
    toEmail: d.toEmail,
    subject,
    html,
    userId: d.userId,
    dedupeKey: `wallet_deposit:${d.paymentCode}`,
  });
});
