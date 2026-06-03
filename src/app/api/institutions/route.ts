import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listAllReceivingInstitutions } from "@/lib/paymongo/client";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const institutions = await listAllReceivingInstitutions();
    return NextResponse.json({ institutions });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Failed to load banks",
        institutions: [],
      },
      { status: 500 }
    );
  }
}
