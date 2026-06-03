import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export async function findAuthUserByEmail(
  service: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized
    );
    if (match) return match;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}
