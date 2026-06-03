import { Suspense } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Loading…
        </p>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
