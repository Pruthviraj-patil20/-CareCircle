import { RegisterForm } from "@/components/auth/register-form";

export default function InvitePage({ params }: { params: { token: string } }) {
  // Normally you would validate the invite token here and prefill the form
  // For now, we will just render the register form.
  return (
    <div className="flex flex-col space-y-4 text-center">
      <h2 className="text-xl font-semibold">You have been invited to CareCircle!</h2>
      <p className="text-muted-foreground text-sm">Please register your account to accept the invitation.</p>
      <RegisterForm />
    </div>
  );
}
