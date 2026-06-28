import { Resend } from "resend";
import { config } from "../config";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;
const isNodeTestRuntime = process.execArgv.some(
  (arg) => arg === "--test" || arg.startsWith("--test-"),
);

export interface SendInput {
  to: string;
  subject: string;
  html: string;
}

// ponytail: when RESEND_API_KEY is unset (local dev) we "send" to the console and
// return a fake id so the rest of the pipeline (email_logs = sent) is exercisable
// without a real provider. Upgrade path: set the key in .env for real delivery.
export async function sendEmail(input: SendInput): Promise<{ id: string }> {
  if (!resend || isNodeTestRuntime) {
    console.log(`[email:dev] -> ${input.to} | ${input.subject}`);
    return { id: `dev-${Date.now()}` };
  }
  const { data, error } = await resend.emails.send({
    from: config.emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) throw new Error(error.message);
  return { id: data!.id };
}
