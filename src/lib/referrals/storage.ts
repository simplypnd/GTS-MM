const REFERRAL_CODE_KEY = "gts_referral_code";

export function storeReferralCode(code: string) {
  if (typeof window === "undefined") return;
  const trimmed = code.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(REFERRAL_CODE_KEY, trimmed);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(REFERRAL_CODE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REFERRAL_CODE_KEY);
  } catch {
    /* ignore */
  }
}
