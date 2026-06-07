import type { AccountStatus } from "@/lib/types/database";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export type ProfileModeration = {
  account_status: AccountStatus;
  funds_frozen: boolean;
};

export class ModerationError extends Error {
  constructor(
    message: string,
    public code: "suspended" | "blocked" | "funds_frozen"
  ) {
    super(message);
    this.name = "ModerationError";
  }
}

export async function getProfileModeration(
  supabase: Supabase,
  userId: string
): Promise<ProfileModeration> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_status, funds_frozen")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { account_status: "active", funds_frozen: false };
  }

  return {
    account_status: (data.account_status ?? "active") as AccountStatus,
    funds_frozen: !!data.funds_frozen,
  };
}

export function assertUserCanTransact(
  profile: ProfileModeration,
  options?: { allowDebit?: boolean }
): void {
  if (profile.account_status === "blocked") {
    throw new ModerationError("Account blocked", "blocked");
  }
  if (profile.account_status === "suspended") {
    throw new ModerationError("Account suspended", "suspended");
  }
  if (options?.allowDebit !== false && profile.funds_frozen) {
    throw new ModerationError("Funds frozen", "funds_frozen");
  }
}

export function moderationErrorResponse(error: unknown) {
  if (error instanceof ModerationError) {
    return { error: error.message, code: error.code, status: 403 as const };
  }
  return null;
}
