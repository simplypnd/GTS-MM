import { NextResponse } from "next/server";
import { listReceivingInstitutions } from "@/lib/paymongo/client";

export async function GET() {
  try {
    const result = await listReceivingInstitutions("instapay");
    return NextResponse.json({ institutions: result.data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed", institutions: [] },
      { status: 500 }
    );
  }
}
