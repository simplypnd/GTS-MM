import { Suspense } from "react";
import { AuthCallbackClient } from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-zinc-600">Completing sign in…</p>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
