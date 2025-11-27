"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Segmented, Select, Skeleton, Empty, Progress, Tooltip } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  InboxOutlined,
  TrophyOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { colors } from "../theme/tokens";
import { LargeMetricCard, MetricCard, MetricCardGrid, Sparkline } from "../dashboard/components/metric-card";

type RangeKey = "7d" | "30d" | "90d" | "365d";

interface BusinessMetrics {
  revenue: {
    total: number;
    change: number;
    byDay: Array<{ date: string; value: number }>;
  };
  orders: {
    total: number;
    change: number;
    byStatus: Array<{ status: string; count: number }>;
    avgValue: number;
  };
  customers: {
    total: number;
    newCustomers: number;
    returningCustomers: number;
    topCustomers: Array<{ email: string; orders: number; spent: number }>;
  };
  products: {
    topSelling: Array<{ id: string; title: string; sold: number; revenue: number }>;
    byFormat: Array<{ format: string; count: number; revenue: number }>;
    lowStock: Array<{ id: string; title: string; stock: number }>;
  };
  inventory: {
    totalValue: number;
    itemsInStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

// Chart colors
const CHART_COLORS = {
  primary: colors.primary.DEFAULT,
  accent: colors.accent.DEFAULT,
  success: colors.success.text,
  warning: colors.warning.text,
  danger: colors.danger.text,
  info: colors.info.text,
};

const PIE_COLORS = [
  colors.primary.DEFAULT,
  colors.accent.DEFAULT,
  colors.success.text,
  colors.warning.text,
  colors.info.text,
  "#9333ea",
];

// Section component
function AnalyticsSection({
  title,
  icon,
  children,
  accentColor = colors.accent.DEFAULT,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: colors.bg.elevated0,
        border: `1px solid ${colors.border.subtle}`,
      }}
    >
      <div
        className="px-5 py-3 flex items-center gap-3 relative"
        style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent 60%)`,
          }}
        />
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.text.medium }}>
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="px-3 py-2 rounded-lg text-sm"
      style={{
        background: colors.bg.elevated2,
        border: `1px solid ${colors.border.DEFAULT}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      <p className="font-medium mb-1" style={{ color: colors.text.high }}>
        {label}
      </p>
      {payload.map((item: any, index: number) => (
        <p key={index} style={{ color: item.color }}>
          {item.name}: {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
        </p>
      ))}
    </div>
  );
}

// List item for rankings
function RankingItem({
  rank,
  title,
  subtitle,
  value,
  maxValue,
  color = colors.accent.DEFAULT,
}: {
  rank: number;
  title: string;
  subtitle?: string;
  value: string | number;
  maxValue?: number;
  color?: string;
}) {
  const percentage = maxValue ? (Number(value) / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: rank <= 3 ? `${color}20` : colors.bg.elevated1,
          color: rank <= 3 ? color : colors.text.low,
        }}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate" style={{ color: colors.text.high }}>
            {title}
          </span>
          <span className="font-mono text-sm flex-shrink-0" style={{ color: colors.text.high }}>
            {value}
          </span>
        </div>
        {subtitle && (
          <span className="text-xs" style={{ color: colors.text.low }}>
            {subtitle}
          </span>
        )}
        {maxValue && (
          <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: colors.bg.elevated2 }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                background: `linear-gradient(90deg, ${color}, ${color}80)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessAnalytics() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/business?range=${range}`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to load business metrics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [range]);

  // Mock data for demo (will be replaced by API)
  const mockMetrics: BusinessMetrics = useMemo(() => ({
    revenue: {
      total: 4523.50,
      change: 12.5,
      byDay: [
        { date: "Mon", value: 450 },
        { date: "Tue", value: 680 },
        { date: "Wed", value: 520 },
        { date: "Thu", value: 890 },
        { date: "Fri", value: 1200 },
        { date: "Sat", value: 350 },
        { date: "Sun", value: 433.50 },
      ],
    },
    orders: {
      total: 47,
      change: 8.2,
      byStatus: [
        { status: "delivered", count: 28 },
        { status: "shipped", count: 8 },
        { status: "processing", count: 6 },
        { status: "paid", count: 3 },
        { status: "pending", count: 2 },
      ],
      avgValue: 96.24,
    },
    customers: {
      total: 156,
      newCustomers: 23,
      returningCustomers: 24,
      topCustomers: [
        { email: "collector@email.com", orders: 12, spent: 1450.00 },
        { email: "vinylhead@email.com", orders: 8, spent: 890.00 },
        { email: "metalfan@email.com", orders: 6, spent: 720.00 },
        { email: "darkarts@email.com", orders: 5, spent: 580.00 },
        { email: "deathwish@email.com", orders: 4, spent: 450.00 },
      ],
    },
    products: {
      topSelling: [
        { id: "1", title: "Morbid Angel - Altars of Madness (Vinyl)", sold: 15, revenue: 599.85 },
        { id: "2", title: "Death - Leprosy (CD)", sold: 12, revenue: 299.88 },
        { id: "3", title: "Bolt Thrower - Realm of Chaos (Cassette)", sold: 10, revenue: 199.90 },
        { id: "4", title: "Entombed - Left Hand Path (Vinyl)", sold: 8, revenue: 319.92 },
        { id: "5", title: "Dismember - Like an Everflowing Stream", sold: 7, revenue: 279.93 },
      ],
      byFormat: [
        { format: "Vinyl", count: 45, revenue: 2250.00 },
        { format: "CD", count: 38, revenue: 950.00 },
        { format: "Cassette", count: 22, revenue: 440.00 },
        { format: "Bundle", count: 8, revenue: 640.00 },
        { format: "Merch", count: 12, revenue: 243.50 },
      ],
      lowStock: [
        { id: "1", title: "Morbid Angel - Altars of Madness", stock: 2 },
        { id: "2", title: "Death - Leprosy", stock: 3 },
        { id: "3", title: "Obituary - Slowly We Rot", stock: 4 },
      ],
    },
    inventory: {
      totalValue: 12450.00,
      itemsInStock: 342,
      lowStockCount: 8,
      outOfStockCount: 3,
    },
  }), []);

  const displayMetrics = metrics || mockMetrics;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton.Input active style={{ width: 200 }} />
          <Skeleton.Input active style={{ width: 300 }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 2 }} />
          ))}
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const revenueSparkline = displayMetrics.revenue.byDay.map((d) => d.value);
  const maxTopCustomerSpend = Math.max(...displayMetrics.customers.topCustomers.map((c) => c.spent));
  const maxTopProductSold = Math.max(...displayMetrics.products.topSelling.map((p) => p.sold));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{
              fontFamily: "var(--font-gothic), 'Cinzel', serif",
              color: colors.text.high,
            }}
          >
            Business Analytics
          </h1>
          <p style={{ color: colors.text.medium }} className="mt-1">
            Track sales, orders, and inventory performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Segmented
            value={range}
            onChange={(v) => setRange(v as RangeKey)}
            options={[
              { label: "7 days", value: "7d" },
              { label: "30 days", value: "30d" },
              { label: "90 days", value: "90d" },
              { label: "1 year", value: "365d" },
            ]}
          />
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LargeMetricCard
          title="Revenue"
          value={`$${displayMetrics.revenue.total.toLocaleString()}`}
          icon={<DollarOutlined />}
          accentColor={colors.success.text}
          sparklineData={revenueSparkline}
          trend={{ value: displayMetrics.revenue.change, label: "vs last period" }}
        />

        <MetricCard
          title="Orders"
          value={displayMetrics.orders.total}
          icon={<ShoppingCartOutlined />}
          change={displayMetrics.orders.change}
          changeLabel="vs last period"
          accentColor={colors.accent.DEFAULT}
          subtitle={`Avg $${displayMetrics.orders.avgValue.toFixed(2)}`}
        />

        <MetricCard
          title="New Customers"
          value={displayMetrics.customers.newCustomers}
          icon={<UserOutlined />}
          accentColor={colors.info.text}
          subtitle={`${displayMetrics.customers.total} total`}
        />

        <MetricCard
          title="Inventory Value"
          value={`$${displayMetrics.inventory.totalValue.toLocaleString()}`}
          icon={<InboxOutlined />}
          accentColor={colors.warning.text}
          subtitle={`${displayMetrics.inventory.itemsInStock} items`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <AnalyticsSection
          title="Revenue Trend"
          icon={<RiseOutlined />}
          accentColor={colors.success.text}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayMetrics.revenue.byDay}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.success.text} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.success.text} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border.subtle} />
                <XAxis
                  dataKey="date"
                  stroke={colors.text.low}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={colors.text.low}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Revenue"
                  stroke={colors.success.text}
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsSection>

        {/* Order Status */}
        <AnalyticsSection
          title="Order Status"
          icon={<ShoppingCartOutlined />}
          accentColor={colors.accent.DEFAULT}
        >
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayMetrics.orders.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, count }) => `${status}: ${count}`}
                  labelLine={{ stroke: colors.text.low }}
                >
                  {displayMetrics.orders.byStatus.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsSection>
      </div>

      {/* Sales by Format */}
      <AnalyticsSection
        title="Sales by Format"
        icon={<TrophyOutlined />}
        accentColor={colors.primary.DEFAULT}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayMetrics.products.byFormat} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.subtle} horizontal={false} />
              <XAxis type="number" stroke={colors.text.low} fontSize={11} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="format" stroke={colors.text.low} fontSize={11} width={70} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill={colors.primary.DEFAULT} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsSection>

      {/* Rankings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <AnalyticsSection
          title="Top Selling Products"
          icon={<TrophyOutlined />}
          accentColor={colors.warning.text}
        >
          <div className="divide-y" style={{ borderColor: colors.border.subtle }}>
            {displayMetrics.products.topSelling.map((product, index) => (
              <RankingItem
                key={product.id}
                rank={index + 1}
                title={product.title}
                subtitle={`${product.sold} sold`}
                value={`$${product.revenue.toFixed(2)}`}
                maxValue={maxTopProductSold}
                color={colors.warning.text}
              />
            ))}
          </div>
        </AnalyticsSection>

        {/* Top Customers */}
        <AnalyticsSection
          title="Top Customers"
          icon={<UserOutlined />}
          accentColor={colors.info.text}
        >
          <div className="divide-y" style={{ borderColor: colors.border.subtle }}>
            {displayMetrics.customers.topCustomers.map((customer, index) => (
              <RankingItem
                key={customer.email}
                rank={index + 1}
                title={customer.email}
                subtitle={`${customer.orders} orders`}
                value={`$${customer.spent.toFixed(2)}`}
                maxValue={maxTopCustomerSpend}
                color={colors.info.text}
              />
            ))}
          </div>
        </AnalyticsSection>
      </div>

      {/* Inventory Alerts */}
      {displayMetrics.products.lowStock.length > 0 && (
        <AnalyticsSection
          title="Low Stock Alerts"
          icon={<ThunderboltOutlined />}
          accentColor={colors.danger.text}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayMetrics.products.lowStock.map((product) => (
              <div
                key={product.id}
                className="p-3 rounded-lg flex items-center justify-between"
                style={{
                  background: colors.danger.bg,
                  border: `1px solid ${colors.danger.border}`,
                }}
              >
                <span className="font-medium truncate" style={{ color: colors.text.high }}>
                  {product.title}
                </span>
                <span
                  className="font-mono font-bold flex-shrink-0 ml-2"
                  style={{ color: colors.danger.text }}
                >
                  {product.stock} left
                </span>
              </div>
            ))}
          </div>
        </AnalyticsSection>
      )}

      {/* Customer Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Returning Customers"
          value={displayMetrics.customers.returningCustomers}
          icon={<UserOutlined />}
          accentColor={colors.success.text}
          subtitle={`${((displayMetrics.customers.returningCustomers / displayMetrics.orders.total) * 100).toFixed(0)}% of orders`}
        />

        <MetricCard
          title="Low Stock Items"
          value={displayMetrics.inventory.lowStockCount}
          icon={<InboxOutlined />}
          accentColor={colors.warning.text}
          subtitle="Need reorder"
        />

        <MetricCard
          title="Out of Stock"
          value={displayMetrics.inventory.outOfStockCount}
          icon={<InboxOutlined />}
          accentColor={colors.danger.text}
          subtitle="Missing sales"
        />

        <MetricCard
          title="Avg Order Value"
          value={`$${displayMetrics.orders.avgValue.toFixed(2)}`}
          icon={<DollarOutlined />}
          accentColor={colors.accent.DEFAULT}
        />
      </div>
    </div>
  );
}
