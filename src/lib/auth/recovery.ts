import type { User } from "@supabase/supabase-js";

/** User must set a new password before using the app (password reset flow). */
export function isRecoveryUser(user: User | null | undefined): boolean {
  return Boolean(user?.recovery_sent_at);
}
