import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch counts in parallel
    const [ordersResult, inventoryResult] = await Promise.all([
      // Count orders that are paid but not yet shipped/delivered
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid")
        .not("status", "in", '("shipped","delivered","cancelled","refunded")'),

      // Count low stock items (available <= 5)
      supabase
        .from("inventory")
        .select("variant_id", { count: "exact", head: true })
        .lte("available", 5),
    ]);

    return NextResponse.json({
      pendingOrders: ordersResult.count ?? 0,
      lowStock: inventoryResult.count ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch nav counts:", error);
    return NextResponse.json(
      { pendingOrders: 0, lowStock: 0 },
      { status: 200 } // Return 200 with zeros on error - non-critical data
    );
  }
}
