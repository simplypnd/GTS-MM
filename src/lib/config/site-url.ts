export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}

/** Use bare callback URL; Supabase appends type=recovery (next= is often stripped). */
export function getPasswordResetRedirectUrl(): string {
  return getAuthCallbackUrl();
}

const ALLOWED_CALLBACK_PATHS = ["/dashboard", "/reset-password"] as const;

export function resolveCallbackNext(
  next: string | null | undefined,
  type: string | null | undefined
): (typeof ALLOWED_CALLBACK_PATHS)[number] {
  if (next === "/reset-password" || type === "recovery") {
    return "/reset-password";
  }
  return "/dashboard";
}
