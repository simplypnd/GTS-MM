/** Parse Supabase auth errors from URL hash (#error=...&error_code=...). */
export function parseAuthHashErrors(): {
  error: string | null;
  errorCode: string | null;
  description: string | null;
} | null {
  if (typeof window === "undefined" || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get("error");
  const errorCode = params.get("error_code");
  if (!error && !errorCode) return null;

  return {
    error,
    errorCode,
    description: params.get("error_description"),
  };
}

export function authHashErrorMessage(
  parsed: NonNullable<ReturnType<typeof parseAuthHashErrors>>
): string {
  if (parsed.errorCode === "otp_expired") {
    return "This reset link has expired. Request a new one.";
  }
  return (
    parsed.description?.replace(/\+/g, " ") ??
    parsed.error ??
    "Authentication link is invalid."
  );
}

export function clearAuthHashFromUrl(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", pathname + search);
}
