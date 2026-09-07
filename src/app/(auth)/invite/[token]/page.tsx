import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/components/auth/register-form";
import { acceptInvitation } from "@/actions/family";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  const { token } = await params;
  
  const invitation: any = await (prisma as any).familyInvitation.findUnique({
    where: { token },
    include: { family: true },
  });

  if (!invitation) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Invalid Invitation</h2>
        <p className="text-muted-foreground">This invitation link is invalid or has already been used.</p>
        <Button render={<Link href="/" />}>Return Home</Button>
      </div>
    );
  }

  if (new Date() > invitation.expires) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Invitation Expired</h2>
        <p className="text-muted-foreground">This invitation link has expired.</p>
        <Button render={<Link href="/" />}>Return Home</Button>
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Join {invitation.family.name}</h2>
          <p className="text-muted-foreground text-sm mt-2">
            You have been invited to join the <strong>{invitation.family.name}</strong> family on CareCircle.
            <br/>Please register or log in with the email address <strong>{invitation.email}</strong> to accept.
          </p>
        </div>
        <RegisterForm />
        <p className="text-sm">
          Already have an account? <Link href={`/login?callbackUrl=/invite/${token}`} className="underline">Log in</Link>
        </p>
      </div>
    );
  }

  if (session.user.email !== invitation.email) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Email Mismatch</h2>
        <p className="text-muted-foreground">
          This invitation was sent to <strong>{invitation.email}</strong> but you are logged in as <strong>{session.user.email}</strong>.
        </p>
        <Button variant="outline" render={<Link href="/api/auth/signout" />}>Log out</Button>
      </div>
    );
  }

  // Define Server Action wrapper to handle the acceptance
  async function handleAccept() {
    "use server";
    await acceptInvitation(token);
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center py-8">
      <CheckCircle2 className="w-12 h-12 text-primary" />
      <div>
        <h2 className="text-2xl font-bold">Ready to join?</h2>
        <p className="text-muted-foreground mt-2">
          You are about to join <strong>{invitation.family.name}</strong> as a <strong>{invitation.role}</strong>.
        </p>
      </div>
      <form action={handleAccept}>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Accept Invitation
        </Button>
      </form>
    </div>
  );
}
