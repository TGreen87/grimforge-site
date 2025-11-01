import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) {
    return NextResponse.json({ ok: false, reason: "missing_key" }, { status: 500 });
  }
  try {
    // Minimal probe only, no network call
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" as any });
    return NextResponse.json({ ok: true, account: "configured" });
  } catch {
    return NextResponse.json({ ok: false, reason: "init_failed" }, { status: 500 });
  }
}
