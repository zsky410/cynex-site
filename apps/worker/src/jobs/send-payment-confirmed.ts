import { EMAIL_JOB, EmailType } from "@cynex/shared";
import { registerHandler } from "../handlers";
import { deliverEmail } from "../email/deliver";
import { paymentConfirmedEmail } from "../email/templates";

registerHandler(EMAIL_JOB.paymentConfirmed, async (job) => {
  const d = job.data as {
    toEmail: string;
    userId?: string;
    userName?: string | null;
    orderId: string;
    orderCode: string;
    totalAmount: number;
  };
  const { subject, html } = paymentConfirmedEmail({
    userName: d.userName,
    orderCode: d.orderCode,
    totalAmount: d.totalAmount,
  });
  await deliverEmail({
    type: EmailType.payment_confirmed,
    toEmail: d.toEmail,
    subject,
    html,
    userId: d.userId,
    orderId: d.orderId,
    dedupeKey: `payment_confirmed:${d.orderId}`,
  });
});
