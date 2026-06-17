import { EMAIL_JOB, EmailType } from "@cynex/shared";
import { registerHandler } from "../handlers";
import { deliverEmail } from "../email/deliver";
import { refundEmail } from "../email/templates";

registerHandler(EMAIL_JOB.refund, async (job) => {
  const d = job.data as {
    toEmail: string;
    userId?: string;
    orderId: string;
    orderCode: string;
    amount: number;
    reason?: string;
    balanceAfter: number;
    sentByAdminId?: string;
  };
  const { subject, html } = refundEmail({
    orderCode: d.orderCode,
    amount: d.amount,
    reason: d.reason,
    balanceAfter: d.balanceAfter,
  });
  await deliverEmail({
    type: EmailType.refund,
    toEmail: d.toEmail,
    subject,
    html,
    userId: d.userId,
    orderId: d.orderId,
    dedupeKey: `refund:${d.orderId}`,
    sentByAdminId: d.sentByAdminId,
  });
});
