export type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export async function fetchUsernameAvailability(
  username: string
): Promise<{ available: boolean; error?: string }> {
  const res = await fetch(
    `/api/auth/check-username?username=${encodeURIComponent(username)}`
  );
  const data = await res.json();
  if (!res.ok) {
    return { available: false, error: data.error ?? "Could not check username" };
  }
  return { available: data.available };
}

export async function fetchEmailAvailability(
  email: string
): Promise<{ available: boolean; error?: string }> {
  const res = await fetch(
    `/api/auth/check-email?email=${encodeURIComponent(email)}`
  );
  const data = await res.json();
  if (!res.ok) {
    return { available: false, error: data.error ?? "Could not check email" };
  }
  return { available: data.available };
}
