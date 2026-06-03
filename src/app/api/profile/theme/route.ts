import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ThemePreference } from "@/lib/theme/constants";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { theme?: string };
  const theme = body.theme;

  if (theme !== "light" && theme !== "dark") {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: theme })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ theme: theme as ThemePreference });
}
