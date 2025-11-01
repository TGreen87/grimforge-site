import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function GET() {
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve();
    return NextResponse.json({ ok: true, account: account.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
