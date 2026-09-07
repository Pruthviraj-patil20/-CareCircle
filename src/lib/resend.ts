import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "CareCircle <onboarding@resend.dev>",
        to,
        subject,
        html,
      });
    } else {
      console.log(`[Email Skipped] Would have sent to ${to}: ${subject}`);
    }
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
