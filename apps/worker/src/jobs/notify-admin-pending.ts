import { prisma } from "@cynex/db";
import { ALERT_JOB } from "@cynex/shared";
import { registerHandler } from "../handlers";

registerHandler(ALERT_JOB.notifyAdminPending, async () => {
  const rows = await prisma.order.findMany({
    where: { fulfillmentStatus: "paid_waiting_admin" },
    orderBy: { paidAt: "asc" },
    take: 20,
    select: {
      id: true,
      orderCode: true,
      totalAmount: true,
      paidAt: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });

  const first = rows[0];
  const waitedMinutes = first
    ? Math.max(
        0,
        Math.round(
          (Date.now() - (first.paidAt ?? first.createdAt).getTime()) / 60_000,
        ),
      )
    : 0;

  console.log(
    `[alerts] pending-orders count=${rows.length} oldest=${first?.orderCode ?? "-"} waitedMinutes=${waitedMinutes}`,
  );
});
