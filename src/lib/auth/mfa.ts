import type { SupabaseClient } from "@supabase/supabase-js";

export type MfaState = {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  needsVerification: boolean;
  hasVerifiedTotp: boolean;
};

export async function getMfaState(
  supabase: SupabaseClient
): Promise<MfaState> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    return {
      currentLevel: null,
      nextLevel: null,
      needsVerification: false,
      hasVerifiedTotp: false,
    };
  }

  const currentLevel = (data.currentLevel ?? null) as "aal1" | "aal2" | null;
  const nextLevel = (data.nextLevel ?? null) as "aal1" | "aal2" | null;

  return {
    currentLevel,
    nextLevel,
    needsVerification: currentLevel === "aal1" && nextLevel === "aal2",
    hasVerifiedTotp: currentLevel === "aal2" || nextLevel === "aal2",
  };
}

export async function userHasVerifiedTotpFactor(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return false;
  return (data.totp ?? []).some((f) => f.status === "verified");
}

export async function assertAal2(supabase: SupabaseClient): Promise<void> {
  const state = await getMfaState(supabase);
  if (state.currentLevel !== "aal2") {
    throw new Error("MFA required");
  }
}

export function getVerifiedTotpFactorId(
  factors: Awaited<
    ReturnType<SupabaseClient["auth"]["mfa"]["listFactors"]>
  >["data"]
): string | null {
  const verified = factors?.totp?.find((f) => f.status === "verified");
  return verified?.id ?? null;
}
