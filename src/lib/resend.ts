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
}): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (apiKey && apiKey !== "re_dummy" && !apiKey.startsWith("re_...")) {
      const from = process.env.EMAIL_FROM || "CareCircle <onboarding@resend.dev>";
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        console.error("[Resend Delivery Error]:", error);
        return { success: false, error: error.message };
      }

      console.log(`[Email Sent] Delivered to ${to}: ${subject} (ID: ${data?.id})`);
      return { success: true };
    } else {
      console.log(`[Email Dev Mode] Delivery bypassed (RESEND_API_KEY not configured). Recipient: ${to}`);
      return {
        success: false,
        error: "RESEND_API_KEY_NOT_CONFIGURED",
      };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
