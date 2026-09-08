"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resendInvitation } from "@/actions/family";
import { toast } from "sonner";
import { Copy, Check, Send, Loader2 } from "lucide-react";

export function PendingInviteActions({
  invitationId,
  token,
  email,
}: {
  invitationId: string;
  token: string;
  email: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopy = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success(`Invite link for ${email} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleResend = () => {
    startTransition(() => {
      resendInvitation(invitationId)
        .then(async (res) => {
          if (res.success) {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const currentToken = res.token || token;
            toast.success(res.success);
          }
        })
        .catch((err) => {
          toast.error(err.message || "Failed to resend invitation");
        });
    });
  };

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
        title="Copy direct invite link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Link</span>
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleResend}
        disabled={isPending}
        className="h-7 px-2.5 text-xs gap-1"
        title="Resend invitation email"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5 text-primary" />
        )}
        <span>{isPending ? "Sending..." : "Resend"}</span>
      </Button>
    </div>
  );
}
