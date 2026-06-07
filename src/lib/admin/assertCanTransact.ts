import type { createServiceClient } from "@/lib/supabase/server";
import {
  getProfileModeration,
  assertUserCanTransact,
  type ProfileModeration,
} from "@/lib/admin/moderation";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function loadAndAssertCanTransact(
  supabase: Supabase,
  userId: string,
  options?: { allowDebit?: boolean }
): Promise<ProfileModeration> {
  const profile = await getProfileModeration(supabase, userId);
  assertUserCanTransact(profile, options);
  return profile;
}
