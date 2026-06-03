import {
  normalizeUsername,
  validateUsername,
} from "@/lib/auth/validation";
import type { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

export function parseCounterpartyIdentifier(raw: string): {
  type: "email" | "username";
  value: string;
} {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return { type: "email", value: trimmed.toLowerCase() };
  }
  return { type: "username", value: normalizeUsername(trimmed) };
}

export async function resolveCounterpartyUserId(
  service: ServiceClient,
  identifier: string
): Promise<{ userId: string; displayName: string } | { error: string }> {
  const parsed = parseCounterpartyIdentifier(identifier);

  if (parsed.type === "username") {
    const formatError = validateUsername(parsed.value);
    if (formatError) {
      return { error: formatError };
    }

    const { data: profile, error } = await service
      .from("profiles")
      .select("id, display_name")
      .ilike("display_name", parsed.value)
      .limit(1)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!profile) {
      return {
        error: "Counterparty not found. They must register first.",
      };
    }
    return { userId: profile.id, displayName: profile.display_name };
  }

  const { data: authData, error: authError } =
    await service.auth.admin.listUsers();

  if (authError) {
    return { error: authError.message };
  }

  const authUser = authData.users.find(
    (u) => u.email?.toLowerCase() === parsed.value
  );

  if (!authUser) {
    return {
      error: "Counterparty not found. They must register first.",
    };
  }

  const { data: profile } = await service
    .from("profiles")
    .select("display_name")
    .eq("id", authUser.id)
    .single();

  return {
    userId: authUser.id,
    displayName: profile?.display_name ?? authUser.email ?? "User",
  };
}
