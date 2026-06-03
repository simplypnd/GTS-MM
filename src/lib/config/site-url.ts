export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}

export function getPasswordResetRedirectUrl(): string {
  return `${getAuthCallbackUrl()}?next=/reset-password`;
}

const ALLOWED_CALLBACK_PATHS = ["/dashboard", "/reset-password"] as const;

export function resolveCallbackNext(
  next: string | null | undefined
): (typeof ALLOWED_CALLBACK_PATHS)[number] {
  if (next === "/reset-password") return "/reset-password";
  return "/dashboard";
}
