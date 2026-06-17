import { EMAIL_JOB, EmailType } from "@cynex/shared";
import { registerHandler } from "../handlers";
import { deliverEmail } from "../email/deliver";
import { resetPasswordEmail } from "../email/templates";

registerHandler(EMAIL_JOB.resetPassword, async (job) => {
  const d = job.data as { toEmail: string; userId?: string; link: string };
  const { subject, html } = resetPasswordEmail({ link: d.link });
  await deliverEmail({
    type: EmailType.reset_password,
    toEmail: d.toEmail,
    subject,
    html,
    userId: d.userId,
  });
});
