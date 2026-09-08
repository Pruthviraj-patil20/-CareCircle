"use client";

import { useState, useEffect, useTransition } from "react";
import { FamilyRole } from "@prisma/client";
import { inviteMember, getOrCreateShareInviteLink } from "@/actions/family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MailPlus, Copy, Check, Share2, Loader2 } from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

export function InviteMemberDialog({
  familyId,
  familyName,
}: {
  familyId: string;
  familyName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FamilyRole>("MEMBER");
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch or generate shareable link whenever dialog is opened or role is changed
  useEffect(() => {
    if (!open) return;
    let isSubscribed = true;
    setIsLoadingToken(true);

    getOrCreateShareInviteLink(familyId, role)
      .then((res) => {
        if (isSubscribed && res?.token) {
          setToken(res.token);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch invite link", err);
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingToken(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [open, familyId, role]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = token ? `${origin}/invite/${token}` : "";

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareWhatsApp = () => {
    if (!inviteUrl) {
      toast.error("Invite link is loading, please wait...");
      return;
    }
    const message = familyName
      ? `Join our family circle "${familyName}" on CareCircle! Click here to accept the invitation:\n${inviteUrl}`
      : `Join our family circle on CareCircle! Click here to accept the invitation:\n${inviteUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareFacebook = () => {
    if (!inviteUrl) {
      toast.error("Invite link is loading, please wait...");
      return;
    }
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareInstagram = async () => {
    if (!inviteUrl) {
      toast.error("Invite link is loading, please wait...");
      return;
    }
    const message = familyName
      ? `Join our family circle "${familyName}" on CareCircle: ${inviteUrl}`
      : `Join our family circle on CareCircle: ${inviteUrl}`;
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Invite link copied! Opening Instagram to paste in your chat...");
    } catch {
      toast.success("Opening Instagram...");
    }
    window.open("https://www.instagram.com/direct/inbox/", "_blank", "noopener,noreferrer");
  };

  const handleShareTelegram = () => {
    if (!inviteUrl) {
      toast.error("Invite link is loading, please wait...");
      return;
    }
    const message = familyName
      ? `Join our family circle "${familyName}" on CareCircle!`
      : `Join our family circle on CareCircle!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (!inviteUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "CareCircle Family Invitation",
          text: familyName
            ? `Join our family circle "${familyName}" on CareCircle!`
            : "Join our family circle on CareCircle!",
          url: inviteUrl,
        });
      } catch {
        // User cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleInviteEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    startTransition(() => {
      inviteMember(familyId, email, role)
        .then((data) => {
          if (data.success) {
            toast.success(data.success);
            setOpen(false);
            setEmail("");
            setRole("MEMBER");
          }
        })
        .catch((err) => toast.error(err.message || "Failed to invite"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <MailPlus className="w-4 h-4 mr-2" />
        Invite Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <MailPlus className="w-5 h-5 text-primary" />
            Invite to Family
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share an invite link via WhatsApp, Instagram, Facebook, or send via email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Role selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">Role for invitee</Label>
              <span className="text-[11px] text-muted-foreground">
                Applies to share link & email
              </span>
            </div>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as FamilyRole)}
              disabled={isPending || isLoadingToken}
            >
              <SelectTrigger className="w-full h-9 bg-background">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member (Standard circle access)</SelectItem>
                <SelectItem value="CAREGIVER">Caregiver (Limited care access)</SelectItem>
                <SelectItem value="ADMIN">Admin (Full circle management)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Social share section */}
          <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-primary" />
                Share via Social & Messaging
              </span>
              {isLoadingToken && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Updating link...
                </span>
              )}
            </div>

            {/* Social quick buttons */}
            <div className="grid grid-cols-4 gap-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={isLoadingToken}
                className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                title="Share on WhatsApp"
              >
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  WhatsApp
                </span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleShareInstagram}
                disabled={isLoadingToken}
                className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/15 text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                title="Share on Instagram"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-pink-700 dark:text-pink-400">
                  Instagram
                </span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleShareFacebook}
                disabled={isLoadingToken}
                className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                title="Share on Facebook"
              >
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                  <FacebookIcon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
                  Facebook
                </span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleShareTelegram}
                disabled={isLoadingToken}
                className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/15 text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                title="Share on Telegram"
              >
                <div className="w-8 h-8 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                  <TelegramIcon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400">
                  Telegram
                </span>
              </button>
            </div>

            {/* Direct copy link input bar */}
            <div className="flex items-center gap-1.5 pt-1">
              <Input
                readOnly
                value={isLoadingToken ? "Generating invite link..." : inviteUrl}
                className="h-8 text-xs font-mono bg-background/80 truncate text-muted-foreground select-all"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                disabled={isLoadingToken || !inviteUrl}
                className="shrink-0 h-8 gap-1 text-xs"
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
              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNativeShare}
                  disabled={isLoadingToken || !inviteUrl}
                  className="shrink-0 h-8 px-2"
                  title="Share with device"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground font-semibold">
                Or invite by email
              </span>
            </div>
          </div>

          {/* Email invite form */}
          <form onSubmit={handleInviteEmail} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Email address</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  required
                  className="h-9 text-xs bg-background"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="shrink-0 h-9 text-xs px-4"
                  disabled={isPending || !email}
                >
                  {isPending ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Invite"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
