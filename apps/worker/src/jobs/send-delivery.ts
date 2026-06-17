import { prisma } from "@cynex/db";
import {
  EMAIL_JOB,
  EmailType,
  leastAdvancedFulfillment,
  type FulfillmentStatus,
} from "@cynex/shared";
import { registerHandler } from "../handlers";
import { deliverEmail } from "../email/deliver";
import { deliveryEmail } from "../email/templates";

// Sends the delivery notification, then flips the item (and its inventory) to
// "delivered" — but ONLY after the email actually sent. deliverEmail throws on
// failure, so a failed send leaves the item at "assigned" for a safe retry/resend.
registerHandler(EMAIL_JOB.delivery, async (job) => {
  const d = job.data as {
    fulfillmentId: string;
    orderId: string;
    orderCode: string;
    toEmail: string;
    userId?: string;
    dedupeKey: string;
  };

  const { subject, html } = deliveryEmail({ orderCode: d.orderCode });
  await deliverEmail({
    type: EmailType.delivery,
    toEmail: d.toEmail,
    subject,
    html,
    userId: d.userId,
    orderId: d.orderId,
    dedupeKey: d.dedupeKey,
  });

  await prisma.$transaction(async (tx) => {
    const f = await tx.orderFulfillment.findUnique({ where: { id: d.fulfillmentId } });
    if (!f) return;

    await tx.orderFulfillment.update({
      where: { id: f.id },
      data: { status: "delivered", deliveredAt: new Date(), emailSentAt: new Date() },
    });
    await tx.orderItem.update({ where: { id: f.orderItemId }, data: { status: "delivered" } });
    if (f.inventoryAccountId) {
      await tx.inventoryAccount.update({
        where: { id: f.inventoryAccountId },
        data: { status: "delivered" },
      });
    }
    if (f.inventoryKeyId) {
      await tx.inventoryKey.update({
        where: { id: f.inventoryKeyId },
        data: { status: "delivered", deliveredAt: new Date() },
      });
    }

    // Roll the order up to its least-advanced item; delivered only once all are.
    const items = await tx.orderItem.findMany({
      where: { orderId: d.orderId },
      select: { fulfillment: { select: { status: true } } },
    });
    const statuses = items
      .map((i) => i.fulfillment?.status)
      .filter((s): s is FulfillmentStatus => !!s);
    const rolled = leastAdvancedFulfillment(statuses);
    if (rolled) {
      await tx.order.update({
        where: { id: d.orderId },
        data: {
          fulfillmentStatus: rolled,
          ...(rolled === "delivered" ? { deliveredAt: new Date() } : {}),
        },
      });
    }
  });
});
