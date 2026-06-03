import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("payout_accounts")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { party_role, account_name, account_number, bank_bic, bank_name } =
    body as {
      party_role: "buyer" | "seller";
      account_name: string;
      account_number: string;
      bank_bic: string;
      bank_name?: string;
    };

  if (!party_role || !account_name || !account_number || !bank_bic) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await supabase
    .from("payout_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("party_role", party_role);

  const { data, error } = await supabase
    .from("payout_accounts")
    .insert({
      user_id: user.id,
      party_role,
      account_name,
      account_number,
      bank_bic,
      bank_name: bank_name ?? null,
      is_default: true,
      verified_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data });
}
