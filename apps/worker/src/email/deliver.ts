import { prisma } from "@cynex/db";
import type { EmailType } from "@cynex/shared";
import { sendEmail } from "./resend";

export interface DeliverInput {
  type: EmailType;
  toEmail: string;
  subject: string;
  html: string;
  userId?: string | null;
  orderId?: string | null;
  dedupeKey?: string | null;
  sentByAdminId?: string | null;
}

// Sends an email and records the result in email_logs. Idempotent on dedupeKey:
// once a row is "sent" we never send again, but failed/queued rows are reused so
// BullMQ retries don't pile up duplicate logs (PRD 18.5 / 12.3).
export async function deliverEmail(input: DeliverInput): Promise<void> {
  let log = input.dedupeKey
    ? await prisma.emailLog.findUnique({ where: { dedupeKey: input.dedupeKey } })
    : null;

  if (log?.status === "sent") return;

  if (!log) {
    log = await prisma.emailLog.create({
      data: {
        type: input.type,
        toEmail: input.toEmail,
        subject: input.subject,
        bodySnapshot: input.html.slice(0, 4000),
        status: "queued",
        userId: input.userId ?? undefined,
        orderId: input.orderId ?? undefined,
        dedupeKey: input.dedupeKey ?? undefined,
        sentByAdminId: input.sentByAdminId ?? undefined,
      },
    });
  }

  try {
    const { id } = await sendEmail({ to: input.toEmail, subject: input.subject, html: input.html });
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "sent", providerMessageId: id, sentAt: new Date(), errorMessage: null },
    });
  } catch (e) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: (e as Error).message },
    });
    throw e; // surface to BullMQ for retry
  }
}
