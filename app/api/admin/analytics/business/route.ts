import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RangeKey = "7d" | "30d" | "90d" | "365d";

function getRangeDate(range: RangeKey): Date {
  const now = new Date();
  const days = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
  };
  now.setDate(now.getDate() - days[range]);
  return now;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = (searchParams.get("range") || "30d") as RangeKey;
  const sinceDate = getRangeDate(range);

  const supabase = createServiceClient();

  try {
    // Fetch orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total, status, payment_status, customer_id, email, created_at")
      .gte("created_at", sinceDate.toISOString())
      .order("created_at", { ascending: true });

    if (ordersError) throw ordersError;

    // Fetch previous period orders for comparison
    const prevStartDate = new Date(sinceDate);
    const periodDays = Math.floor((Date.now() - sinceDate.getTime()) / (1000 * 60 * 60 * 24));
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);

    const { data: prevOrders } = await supabase
      .from("orders")
      .select("id, total")
      .gte("created_at", prevStartDate.toISOString())
      .lt("created_at", sinceDate.toISOString());

    // Fetch order items for product analysis
    const orderIds = orders?.map((o) => o.id) || [];
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("order_id, product_id, quantity, unit_price, products(id, title, format)")
      .in("order_id", orderIds.length > 0 ? orderIds : ["none"]);

    // Fetch customers
    const { data: customers } = await supabase
      .from("customers")
      .select("id, email, created_at")
      .gte("created_at", sinceDate.toISOString());

    // Fetch all customers for total count
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true });

    // Fetch inventory
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, stock, price, products(id, title)");

    // Calculate revenue
    const currentRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const prevRevenue = prevOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const revenueChange = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : 0;

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    orders?.forEach((order) => {
      const date = new Date(order.created_at);
      const dayKey = dayNames[date.getDay()];
      revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + (order.total || 0);
    });

    const revenueByDayArray = dayNames.map((day) => ({
      date: day,
      value: revenueByDay[day] || 0,
    }));

    // Order stats
    const orderCount = orders?.length || 0;
    const prevOrderCount = prevOrders?.length || 0;
    const ordersChange = prevOrderCount > 0
      ? ((orderCount - prevOrderCount) / prevOrderCount) * 100
      : 0;

    const avgOrderValue = orderCount > 0 ? currentRevenue / orderCount : 0;

    // Orders by status
    const statusCounts: Record<string, number> = {};
    orders?.forEach((order) => {
      const status = order.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Product analysis
    const productSales: Record<string, { id: string; title: string; sold: number; revenue: number }> = {};
    const formatSales: Record<string, { format: string; count: number; revenue: number }> = {};

    orderItems?.forEach((item: any) => {
      const product = item.products;
      if (product) {
        if (!productSales[product.id]) {
          productSales[product.id] = {
            id: product.id,
            title: product.title,
            sold: 0,
            revenue: 0,
          };
        }
        productSales[product.id].sold += item.quantity;
        productSales[product.id].revenue += item.quantity * item.unit_price;

        const format = product.format || "Other";
        if (!formatSales[format]) {
          formatSales[format] = { format, count: 0, revenue: 0 };
        }
        formatSales[format].count += item.quantity;
        formatSales[format].revenue += item.quantity * item.unit_price;
      }
    });

    const topSelling = Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const byFormat = Object.values(formatSales)
      .sort((a, b) => b.revenue - a.revenue);

    // Low stock items
    const lowStock = (variants || [])
      .filter((v: any) => v.stock > 0 && v.stock <= 5)
      .map((v: any) => ({
        id: v.id,
        title: v.products?.title || "Unknown",
        stock: v.stock,
      }))
      .slice(0, 5);

    // Inventory stats
    const inventoryValue = (variants || []).reduce(
      (sum: number, v: any) => sum + (v.stock || 0) * (v.price || 0),
      0
    );
    const itemsInStock = (variants || []).reduce(
      (sum: number, v: any) => sum + (v.stock || 0),
      0
    );
    const lowStockCount = (variants || []).filter(
      (v: any) => v.stock > 0 && v.stock <= 5
    ).length;
    const outOfStockCount = (variants || []).filter(
      (v: any) => v.stock === 0
    ).length;

    // Customer analysis
    const newCustomerCount = customers?.length || 0;

    // Top customers by spend
    const customerSpend: Record<string, { email: string; orders: number; spent: number }> = {};
    orders?.forEach((order) => {
      const email = order.email || "unknown";
      if (!customerSpend[email]) {
        customerSpend[email] = { email, orders: 0, spent: 0 };
      }
      customerSpend[email].orders += 1;
      customerSpend[email].spent += order.total || 0;
    });

    const topCustomers = Object.values(customerSpend)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    // Returning customers (more than 1 order)
    const returningCustomers = Object.values(customerSpend).filter(
      (c) => c.orders > 1
    ).length;

    return NextResponse.json({
      revenue: {
        total: currentRevenue,
        change: revenueChange,
        byDay: revenueByDayArray,
      },
      orders: {
        total: orderCount,
        change: ordersChange,
        byStatus: ordersByStatus,
        avgValue: avgOrderValue,
      },
      customers: {
        total: totalCustomers || 0,
        newCustomers: newCustomerCount,
        returningCustomers,
        topCustomers,
      },
      products: {
        topSelling,
        byFormat,
        lowStock,
      },
      inventory: {
        totalValue: inventoryValue,
        itemsInStock,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    console.error("Business analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load business analytics" },
      { status: 500 }
    );
  }
}
