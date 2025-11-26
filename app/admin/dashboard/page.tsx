import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";

import { createServiceClient } from "@/lib/supabase/server";
import { mapRevenueSeries, mapLowStockTrend } from "@/lib/dashboard";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";

import RevenueChart from "./components/revenue-chart";
import LowStockChart from "./components/low-stock-chart";
import { MetricCard, MetricCardGrid } from "./components/metric-card";
import { ActivityFeed, type ActivityItem } from "./components/activity-feed";
import { AttentionPanel, type AttentionItem } from "./components/attention-panel";
import AnnouncementCard from "./components/announcement-card";
import RevenueGoalCard from "./components/revenue-goal-card";
import { CatalogHealthCard, type CatalogHealthSummary } from "./components/catalog-health-card";
import { WebhookHealth } from "./components/webhook-health";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { colors } from "../theme/tokens";

// Types
interface OrderRecord {
  id: string;
  order_number: string | null;
  total: number | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  customer?: {
    email?: string;
    name?: string;
  } | null;
}

interface InventoryRecord {
  variant_id: string;
  on_hand: number | null;
  available: number | null;
  variants: {
    id: string;
    name: string | null;
    price: number | null;
    products: {
      id: string;
      title: string | null;
    } | null;
  } | null;
}

interface RevenuePoint {
  day: string;
  paid_total: number;
  pending_total: number;
}

interface LowStockPoint {
  day: string;
  low_stock_count: number;
}

interface AnnouncementRecord {
  id: string;
  message: string;
  updated_at: string;
}

interface AnnouncementHistoryEntry {
  id: string;
  message: string;
  created_at: string;
  created_by?: string | null;
}

interface AdminSettings {
  dashboard_alerts: {
    awaiting_fulfilment_threshold: number;
    low_stock_threshold: number;
    enable_dashboard_alerts?: boolean;
  };
  revenue_goal: {
    target: number;
    period: "7d" | "30d";
  };
}

// Helper functions
function sumPaid(series: RevenuePoint[]) {
  return series.reduce((sum, point) => sum + Number(point.paid_total ?? 0), 0);
}

function computeRevenueChange(series: RevenuePoint[]) {
  if (series.length === 0) {
    return { current: 0, previous: 0, changePct: null };
  }
  const currentWindow = series.slice(-7);
  const previousWindow = series.slice(-14, -7);

  const current = sumPaid(currentWindow);
  const previous = sumPaid(previousWindow);
  const changePct =
    previous > 0 ? ((current - previous) / previous) * 100 : null;

  return { current, previous, changePct };
}

function formatCurrency(amount: number, currency = "AUD") {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Data fetchers
async function fetchOrderSummary() {
  const supabase = createServiceClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, total, status, payment_status, created_at, customer:customers(email, name)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const allOrders = (orders ?? []) as OrderRecord[];

  const totalRevenue = allOrders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  const paidOrders = allOrders.filter(
    (order) => order.payment_status === "paid"
  ).length;
  const pendingOrders = allOrders.filter(
    (order) => order.payment_status !== "paid"
  ).length;
  const awaitingFulfillment = allOrders.filter((order) => {
    if (order.payment_status !== "paid") return false;
    const status = (order.status ?? "").toLowerCase();
    return !["shipped", "delivered", "cancelled", "refunded"].includes(status);
  }).length;

  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = allOrders.filter(
    (order) => new Date(order.created_at) >= today
  );
  const todayRevenue = todayOrders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  return {
    totalRevenue,
    paidOrders,
    pendingOrders,
    awaitingFulfillment,
    latestOrders: allOrders,
    todayOrders: todayOrders.length,
    todayRevenue,
  };
}

async function fetchLowStock(): Promise<InventoryRecord[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("inventory")
    .select(
      `
      variant_id,
      on_hand,
      available,
      variants:variant_id!inner (
        id,
        name,
        price,
        products:product_id!inner (
          id,
          title
        )
      )
    `
    )
    .lte("available", 5)
    .order("available", { ascending: true })
    .limit(10);

  // Type assertion for complex join
  return (data ?? []).map((row: any) => {
    const variant = Array.isArray(row.variants) ? row.variants[0] : row.variants;
    const product = variant?.products
      ? Array.isArray(variant.products)
        ? variant.products[0]
        : variant.products
      : null;

    return {
      variant_id: row.variant_id,
      on_hand: row.on_hand,
      available: row.available,
      variants: variant
        ? {
            id: variant.id,
            name: variant.name,
            price: variant.price,
            products: product,
          }
        : null,
    };
  });
}

async function fetchCustomerCount(): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

async function fetchRevenueSeries(days = 30): Promise<RevenuePoint[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("orders_revenue_series", { days });
  return mapRevenueSeries(Array.isArray(data) ? data : []);
}

async function fetchLowStockTrend(days = 14): Promise<LowStockPoint[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("inventory_low_stock_trend", { days });
  return mapLowStockTrend(Array.isArray(data) ? data : []);
}

async function fetchAnnouncement(): Promise<AnnouncementRecord | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dashboard_announcements")
    .select("id, message, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    message: data.message ?? "",
    updated_at: data.updated_at ?? new Date().toISOString(),
  };
}

async function fetchAnnouncementHistory(): Promise<AnnouncementHistoryEntry[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dashboard_announcement_history")
    .select("id, message, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((entry) => ({
    id: entry.id,
    message: entry.message ?? "",
    created_at: entry.created_at ?? new Date().toISOString(),
    created_by: entry.created_by,
  }));
}

async function fetchAdminSettings(): Promise<AdminSettings> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", ["dashboard_alerts", "dashboard_revenue_goal"]);

  const defaults = {
    dashboard_alerts: {
      awaiting_fulfilment_threshold: 3,
      low_stock_threshold: 5,
      enable_dashboard_alerts: true,
    },
    revenue_goal: {
      target: 5000,
      period: "30d" as "7d" | "30d",
    },
  };

  if (!data) return defaults;

  for (const row of data) {
    if (row.key === "dashboard_alerts" && row.value) {
      defaults.dashboard_alerts = {
        awaiting_fulfilment_threshold: Number(
          (row.value as any)?.awaiting_fulfilment_threshold ?? 3
        ),
        low_stock_threshold: Number(
          (row.value as any)?.low_stock_threshold ?? 5
        ),
        enable_dashboard_alerts: Boolean(
          (row.value as any)?.enable_dashboard_alerts ?? true
        ),
      };
    }
    if (row.key === "dashboard_revenue_goal" && row.value) {
      const goal = row.value as Record<string, unknown>;
      const target = Number(goal?.target ?? 5000);
      const periodRaw = (goal?.period ?? "30d") as string;
      defaults.revenue_goal = {
        target: Number.isFinite(target) ? target : 5000,
        period: periodRaw === "7d" ? "7d" : "30d",
      };
    }
  }

  return defaults;
}

async function fetchCatalogHealth(): Promise<CatalogHealthSummary> {
  const supabase = createServiceClient();

  const [productsRes, inventoryRes] = await Promise.all([
    supabase.from("products").select("id, title, active"),
    supabase
      .from("inventory")
      .select(
        `
        variant_id,
        available,
        variants:variant_id!inner (
          id,
          active,
          product_id,
          products:product_id!inner (id, title, active)
        )
      `
      )
      .lte("available", 0),
  ]);

  const activeProducts = (productsRes.data ?? []).filter((p) => p.active);
  const zeroStockActive = (inventoryRes.data ?? []).filter((row: any) => {
    const variant = Array.isArray(row.variants)
      ? row.variants[0]
      : row.variants;
    const product = variant?.products
      ? Array.isArray(variant.products)
        ? variant.products[0]
        : variant.products
      : null;
    return (
      variant?.active === true &&
      product?.active === true &&
      (row.available ?? 0) <= 0
    );
  });

  const productsWithActiveVariants = new Set<string>();
  zeroStockActive.forEach((row: any) => {
    const variant = Array.isArray(row.variants)
      ? row.variants[0]
      : row.variants;
    const product = variant?.products
      ? Array.isArray(variant.products)
        ? variant.products[0]
        : variant.products
      : null;
    if (product?.id) productsWithActiveVariants.add(product.id);
  });

  const { data: activeVariants } = await supabase
    .from("variants")
    .select("id, product_id, active")
    .eq("active", true);

  activeVariants?.forEach((v) => {
    if (v.product_id) productsWithActiveVariants.add(v.product_id);
  });

  const missingVariants = activeProducts.filter(
    (p) => !productsWithActiveVariants.has(p.id)
  );

  return {
    missingVariants: missingVariants
      .slice(0, 8)
      .map((p) => ({ id: p.id, title: p.title ?? "Untitled product" })),
    zeroStock: zeroStockActive.slice(0, 8).map((row: any) => {
      const variant = Array.isArray(row.variants)
        ? row.variants[0]
        : row.variants;
      const product = variant?.products
        ? Array.isArray(variant.products)
          ? variant.products[0]
          : variant.products
        : null;
      return {
        variantId: variant?.id ?? row.variant_id,
        title: product?.title ?? "Variant",
        available: row.available ?? 0,
      };
    }),
  };
}

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const supabase = createServiceClient();

  const { data: auditLogs } = await supabase
    .from("audit_log")
    .select("id, event_type, resource_type, resource_id, changes, created_at")
    .order("created_at", { ascending: false })
    .limit(15);

  return (auditLogs ?? []).map((log) => {
    let type: ActivityItem["type"] = "system";
    let title = log.event_type ?? "Activity";
    let link: string | undefined;

    if (log.resource_type === "orders") {
      type = "order";
      title = `Order ${log.event_type?.replace("_", " ") ?? "updated"}`;
      link = `/admin/orders/show/${log.resource_id}`;
    } else if (log.resource_type === "inventory") {
      type = "stock";
      title = "Stock updated";
      link = `/admin/inventory`;
    } else if (log.resource_type === "customers") {
      type = "customer";
      title = `Customer ${log.event_type?.replace("_", " ") ?? "updated"}`;
      link = `/admin/customers/show/${log.resource_id}`;
    } else if (log.event_type?.includes("payment")) {
      type = "payment";
      title = "Payment received";
    }

    return {
      id: log.id,
      type,
      title,
      timestamp: log.created_at,
      link,
    };
  });
}

// Compute functions
function computeWindowTotals(series: RevenuePoint[], days: number) {
  const current = sumPaid(series.slice(-days));
  const previous = sumPaid(series.slice(-(days * 2), -days));
  return {
    current,
    previous,
    changePct: previous > 0 ? ((current - previous) / previous) * 100 : null,
  };
}

function buildAttentionItems(
  awaitingFulfillment: number,
  lowStockCount: number,
  webhookErrors: number,
  settings: AdminSettings["dashboard_alerts"]
): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (awaitingFulfillment > 0) {
    items.push({
      id: "fulfillment",
      type: "fulfillment",
      title: "orders need fulfillment",
      count: awaitingFulfillment,
      severity:
        awaitingFulfillment >= settings.awaiting_fulfilment_threshold
          ? "critical"
          : "warning",
      actionLabel: "View",
      actionLink: "/admin/orders?status=paid",
    });
  }

  if (lowStockCount > 0) {
    items.push({
      id: "lowstock",
      type: "lowstock",
      title: "items low on stock",
      count: lowStockCount,
      severity:
        lowStockCount >= settings.low_stock_threshold ? "critical" : "warning",
      actionLabel: "Restock",
      actionLink: "/admin/inventory",
    });
  }

  if (webhookErrors > 0) {
    items.push({
      id: "webhook",
      type: "webhook",
      title: "webhook errors",
      count: webhookErrors,
      severity: "warning",
      actionLabel: "View",
      actionLink: "/admin/webhooks",
    });
  }

  return items;
}

// Main component
export default async function AdminDashboardPage() {
  const [
    summary,
    lowStock,
    customerCount,
    revenueSeries30,
    lowStockTrend,
    announcement,
    announcementHistory,
    adminSettings,
    catalogHealth,
    recentActivity,
  ] = await Promise.all([
    fetchOrderSummary(),
    fetchLowStock(),
    fetchCustomerCount(),
    fetchRevenueSeries(30),
    fetchLowStockTrend(21),
    fetchAnnouncement(),
    fetchAnnouncementHistory(),
    fetchAdminSettings(),
    fetchCatalogHealth(),
    fetchRecentActivity(),
  ]);

  const revenueStats = computeRevenueChange(revenueSeries30);
  const revenueSeries7 = revenueSeries30.slice(-7);
  const alertsConfig = adminSettings.dashboard_alerts;
  const revenueGoal = adminSettings.revenue_goal;
  const goalWindowDays = revenueGoal.period === "7d" ? 7 : 30;
  const goalStats = computeWindowTotals(revenueSeries30, goalWindowDays);

  const attentionItems = buildAttentionItems(
    summary.awaitingFulfillment,
    lowStock.length,
    0, // webhook errors - would come from webhook health check
    alertsConfig
  );

  const greeting = getTimeBasedGreeting();

  return (
    <div className="space-y-6 admin-animate-fade-in">
      {/* Welcome Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1
            className="admin-heading admin-heading-xl"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {greeting}
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.text.medium }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")} • Here's your business
            overview
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/products/create">Add Product</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/orders">View Orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/inventory">Receive Stock</Link>
          </Button>
        </div>
      </header>

      {/* Announcement */}
      <AnnouncementCard announcement={announcement} history={announcementHistory} />

      {/* Attention Panel */}
      {attentionItems.length > 0 && (
        <section>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: colors.text.low }}
          >
            Needs Attention
          </h2>
          <AttentionPanel items={attentionItems} />
        </section>
      )}

      {/* KPI Metrics */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: colors.text.low }}
        >
          Today's Performance
        </h2>
        <MetricCardGrid>
          <MetricCard
            title="Revenue Today"
            value={formatCurrency(summary.todayRevenue)}
            icon={<DollarOutlined />}
            accentColor={colors.success.text}
          />
          <MetricCard
            title="Orders Today"
            value={summary.todayOrders}
            icon={<ShoppingCartOutlined />}
            accentColor={colors.accent.DEFAULT}
          />
          <MetricCard
            title="Awaiting Fulfillment"
            value={summary.awaitingFulfillment}
            icon={<InboxOutlined />}
            accentColor={
              summary.awaitingFulfillment > 0
                ? colors.warning.text
                : colors.success.text
            }
          />
          <MetricCard
            title="Total Customers"
            value={customerCount}
            icon={<UserOutlined />}
            accentColor={colors.info.text}
          />
        </MetricCardGrid>
      </section>

      {/* Revenue Goal */}
      <RevenueGoalCard
        current={goalStats.current}
        previous={goalStats.previous}
        changePct={goalStats.changePct}
        target={revenueGoal.target}
        period={revenueGoal.period}
        currency="AUD"
      />

      {/* Charts Row */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - 2/3 width */}
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{
            background: colors.bg.elevated0,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="font-semibold"
                style={{ color: colors.text.high }}
              >
                Revenue Trend
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.text.medium }}>
                Last 30 days • 7-day:{" "}
                <span style={{ color: colors.text.high }}>
                  {formatCurrency(revenueStats.current)}
                </span>
                {revenueStats.changePct !== null && (
                  <span
                    className="ml-2"
                    style={{
                      color:
                        revenueStats.changePct >= 0
                          ? colors.success.text
                          : colors.danger.text,
                    }}
                  >
                    {revenueStats.changePct >= 0 ? "+" : ""}
                    {revenueStats.changePct.toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <Suspense
              fallback={
                <div className="admin-skeleton w-full h-full rounded-lg" />
              }
            >
              <RevenueChart
                data={revenueSeries30}
                highlightWindow={revenueSeries7}
              />
            </Suspense>
          </div>
        </div>

        {/* Activity Feed - 1/3 width */}
        <div
          className="rounded-xl p-5"
          style={{
            background: colors.bg.elevated0,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <h3
            className="font-semibold mb-4"
            style={{ color: colors.text.high }}
          >
            Recent Activity
          </h3>
          <ActivityFeed items={recentActivity} maxItems={6} />
        </div>
      </section>

      {/* Secondary Charts Row */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Chart */}
        <div
          className="rounded-xl p-5"
          style={{
            background: colors.bg.elevated0,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="font-semibold"
                style={{ color: colors.text.high }}
              >
                Stock Levels
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.text.medium }}>
                Items at or below threshold (≤5 available)
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs hover:underline"
              style={{ color: colors.accent.DEFAULT }}
            >
              View all →
            </Link>
          </div>
          <div className="h-[200px]">
            <Suspense
              fallback={
                <div className="admin-skeleton w-full h-full rounded-lg" />
              }
            >
              <LowStockChart data={lowStockTrend} />
            </Suspense>
          </div>
        </div>

        {/* Catalog Health */}
        <CatalogHealthCard summary={catalogHealth} />
      </section>

      {/* Webhook Health */}
      <WebhookHealth />

      {/* Recent Orders */}
      <section
        className="rounded-xl p-5"
        style={{
          background: colors.bg.elevated0,
          border: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-semibold"
            style={{ color: colors.text.high }}
          >
            Recent Orders
          </h3>
          <Link
            href="/admin/orders"
            className="text-xs hover:underline"
            style={{ color: colors.accent.DEFAULT }}
          >
            View all →
          </Link>
        </div>

        {summary.latestOrders.length === 0 ? (
          <p className="text-sm" style={{ color: colors.text.medium }}>
            No orders yet. Orders will appear here once customers complete
            checkout.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wider"
                  style={{ color: colors.text.low }}
                >
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: colors.border.subtle }}>
                {summary.latestOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="py-3">
                      <Link
                        href={`/admin/orders/show/${order.id}`}
                        className="admin-mono hover:underline"
                        style={{ color: colors.accent.DEFAULT }}
                      >
                        {order.order_number || order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span style={{ color: colors.text.medium }}>
                        {order.customer?.email || "Guest"}
                      </span>
                    </td>
                    <td className="py-3">
                      <OrderStatusBadge
                        status={order.status}
                        paymentStatus={order.payment_status}
                      />
                    </td>
                    <td
                      className="py-3 text-right admin-mono"
                      style={{ color: colors.text.high }}
                    >
                      {order.total ? formatCurrency(Number(order.total)) : "—"}
                    </td>
                    <td
                      className="py-3 text-right text-sm"
                      style={{ color: colors.text.low }}
                    >
                      {format(new Date(order.created_at), "MMM d")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// Helper components
function OrderStatusBadge({
  status,
  paymentStatus,
}: {
  status: string | null;
  paymentStatus: string | null;
}) {
  const displayStatus = status || "pending";
  const isPaid = paymentStatus === "paid";

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: colors.warning.bg, text: colors.warning.text },
    paid: { bg: colors.success.bg, text: colors.success.text },
    processing: { bg: colors.info.bg, text: colors.info.text },
    shipped: { bg: colors.accent.ghost, text: colors.accent.DEFAULT },
    delivered: { bg: colors.success.bg, text: colors.success.text },
    cancelled: { bg: colors.danger.bg, text: colors.danger.text },
    refunded: { bg: colors.bg.elevated1, text: colors.text.medium },
  };

  const colorSet = statusColors[displayStatus] || statusColors.pending;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: colorSet.bg, color: colorSet.text }}
    >
      {isPaid && displayStatus !== "paid" && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: colors.success.text }}
        />
      )}
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
    </span>
  );
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
