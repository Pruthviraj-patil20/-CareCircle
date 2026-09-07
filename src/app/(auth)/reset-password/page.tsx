import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
