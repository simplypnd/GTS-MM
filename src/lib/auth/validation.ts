const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim();
}

export function validateUsername(username: string): string | null {
  const trimmed = normalizeUsername(username);
  if (!trimmed) return "Username is required";
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Username must be 3–30 characters (letters, numbers, underscore only)";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return "Email is required";
  if (!EMAIL_REGEX.test(normalized)) return "Enter a valid email address";
  return null;
}

export function isRateLimitError(message: string): boolean {
  return /rate limit/i.test(message);
}

export const RATE_LIMIT_MESSAGE =
  "Too many emails sent. Wait a few minutes before trying again.";
