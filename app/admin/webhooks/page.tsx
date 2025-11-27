"use client";

import React from "react";
import { Table, Tag, Tooltip, Empty, Statistic, Progress } from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { formatDistanceToNow, format } from "date-fns";
import { colors } from "../theme/tokens";

interface WebhookEvent {
  id: string;
  event_id: string;
  type: string;
  status: string;
  created_at: string;
}

// Map event types to friendly names and icons
const eventTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "checkout.session.completed": {
    label: "Checkout Complete",
    color: colors.success.text,
    icon: <CheckCircleOutlined />,
  },
  "payment_intent.succeeded": {
    label: "Payment Success",
    color: colors.success.text,
    icon: <CheckCircleOutlined />,
  },
  "payment_intent.payment_failed": {
    label: "Payment Failed",
    color: colors.danger.text,
    icon: <CloseCircleOutlined />,
  },
  "customer.created": {
    label: "New Customer",
    color: colors.accent.DEFAULT,
    icon: <ThunderboltOutlined />,
  },
  "invoice.paid": {
    label: "Invoice Paid",
    color: colors.success.text,
    icon: <CheckCircleOutlined />,
  },
  "charge.refunded": {
    label: "Refund Issued",
    color: colors.warning.text,
    icon: <WarningOutlined />,
  },
};

const getEventConfig = (type: string) => {
  return (
    eventTypeConfig[type] || {
      label: type.replace(/_/g, " ").replace(/\./g, " → "),
      color: colors.text.medium,
      icon: <ApiOutlined />,
    }
  );
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "ok":
    case "success":
      return {
        color: colors.success.text,
        bg: colors.success.bg,
        label: "Success",
        icon: <CheckCircleOutlined />,
      };
    case "error":
    case "failed":
      return {
        color: colors.danger.text,
        bg: colors.danger.bg,
        label: "Failed",
        icon: <CloseCircleOutlined />,
      };
    case "pending":
      return {
        color: colors.warning.text,
        bg: colors.warning.bg,
        label: "Pending",
        icon: <SyncOutlined spin />,
      };
    default:
      return {
        color: colors.text.medium,
        bg: colors.bg.elevated1,
        label: status,
        icon: <ClockCircleOutlined />,
      };
  }
};

export default function WebhooksPage() {
  const [events, setEvents] = React.useState<WebhookEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/admin/webhook-events");
        if (!res.ok) throw new Error("Failed to load webhook events");
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Calculate stats
  const successCount = events.filter((e) => e.status === "ok" || e.status === "success").length;
  const failedCount = events.filter((e) => e.status === "error" || e.status === "failed").length;
  const successRate = events.length > 0 ? Math.round((successCount / events.length) * 100) : 100;
  const last24h = events.filter(
    (e) => new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  const columns = [
    {
      title: "Event",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const config = getEventConfig(type);
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{
                background: `${config.color}15`,
                color: config.color,
              }}
            >
              {config.icon}
            </div>
            <div>
              <div className="font-medium" style={{ color: colors.text.high }}>
                {config.label}
              </div>
              <div className="text-xs" style={{ color: colors.text.low }}>
                {type}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag
            icon={config.icon}
            style={{
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.color}40`,
              borderRadius: 6,
            }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Time",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => (
        <Tooltip title={format(new Date(date), "PPpp")}>
          <div className="flex items-center gap-2" style={{ color: colors.text.medium }}>
            <ClockCircleOutlined style={{ fontSize: 12 }} />
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Event ID",
      dataIndex: "event_id",
      key: "event_id",
      ellipsis: true,
      render: (id: string) => (
        <code
          className="text-xs px-2 py-1 rounded"
          style={{
            background: colors.bg.elevated1,
            color: colors.text.low,
            fontFamily: "monospace",
          }}
        >
          {id}
        </code>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{
              fontFamily: "var(--font-gothic), 'Cinzel', serif",
              color: colors.text.high,
            }}
          >
            Webhook Events
          </h1>
          <p style={{ color: colors.text.medium }} className="mt-1">
            Monitor Stripe webhook deliveries and troubleshoot integration issues
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com/webhooks"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
          style={{
            background: colors.bg.elevated1,
            border: `1px solid ${colors.border.DEFAULT}`,
            color: colors.text.high,
          }}
        >
          Open Stripe Dashboard →
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Events */}
        <div
          className="p-4 rounded-xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.bg.elevated0} 0%, ${colors.bg.elevated1} 100%)`,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent.DEFAULT}60, transparent)`,
            }}
          />
          <Statistic
            title={<span style={{ color: colors.text.medium }}>Total Events</span>}
            value={events.length}
            valueStyle={{ color: colors.text.high, fontFamily: "monospace" }}
            prefix={<ApiOutlined style={{ color: colors.accent.DEFAULT }} />}
          />
        </div>

        {/* Last 24h */}
        <div
          className="p-4 rounded-xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.bg.elevated0} 0%, ${colors.bg.elevated1} 100%)`,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.info.text}60, transparent)`,
            }}
          />
          <Statistic
            title={<span style={{ color: colors.text.medium }}>Last 24 Hours</span>}
            value={last24h}
            valueStyle={{ color: colors.text.high, fontFamily: "monospace" }}
            prefix={<ClockCircleOutlined style={{ color: colors.info.text }} />}
          />
        </div>

        {/* Success Rate */}
        <div
          className="p-4 rounded-xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.bg.elevated0} 0%, ${colors.bg.elevated1} 100%)`,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.success.text}60, transparent)`,
            }}
          />
          <div className="flex items-center justify-between">
            <Statistic
              title={<span style={{ color: colors.text.medium }}>Success Rate</span>}
              value={successRate}
              suffix="%"
              valueStyle={{
                color: successRate >= 95 ? colors.success.text : colors.warning.text,
                fontFamily: "monospace",
              }}
            />
          </div>
          <Progress
            percent={successRate}
            showInfo={false}
            strokeColor={successRate >= 95 ? colors.success.text : colors.warning.text}
            trailColor={colors.bg.elevated2}
            size="small"
            className="mt-2"
          />
        </div>

        {/* Failed */}
        <div
          className="p-4 rounded-xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.bg.elevated0} 0%, ${colors.bg.elevated1} 100%)`,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${failedCount > 0 ? colors.danger.text : colors.success.text}60, transparent)`,
            }}
          />
          <Statistic
            title={<span style={{ color: colors.text.medium }}>Failed Events</span>}
            value={failedCount}
            valueStyle={{
              color: failedCount > 0 ? colors.danger.text : colors.success.text,
              fontFamily: "monospace",
            }}
            prefix={
              failedCount > 0 ? (
                <WarningOutlined style={{ color: colors.danger.text }} />
              ) : (
                <CheckCircleOutlined style={{ color: colors.success.text }} />
              )
            }
          />
        </div>
      </div>

      {/* Events Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: colors.bg.elevated0,
          border: `1px solid ${colors.border.subtle}`,
        }}
      >
        {error ? (
          <div className="p-8 text-center">
            <WarningOutlined
              style={{ fontSize: 48, color: colors.warning.text }}
              className="mb-4"
            />
            <p style={{ color: colors.text.high }} className="text-lg font-medium">
              Unable to load webhook events
            </p>
            <p style={{ color: colors.text.medium }} className="mt-1">
              {error}
            </p>
          </div>
        ) : (
          <Table
            dataSource={events}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              showTotal: (total) => (
                <span style={{ color: colors.text.medium }}>
                  {total} event{total !== 1 ? "s" : ""}
                </span>
              ),
            }}
            locale={{
              emptyText: (
                <Empty
                  image={
                    <ApiOutlined
                      style={{
                        fontSize: 64,
                        color: colors.text.low,
                        opacity: 0.5,
                      }}
                    />
                  }
                  description={
                    <div className="space-y-2">
                      <p style={{ color: colors.text.high }} className="text-base font-medium">
                        No webhook events yet
                      </p>
                      <p style={{ color: colors.text.medium }} className="text-sm">
                        Complete a test checkout to see webhook events appear here
                      </p>
                    </div>
                  }
                />
              ),
            }}
          />
        )}
      </div>

      {/* Help Section */}
      <div
        className="p-4 rounded-xl flex items-start gap-4"
        style={{
          background: colors.info.bg,
          border: `1px solid ${colors.info.border}`,
        }}
      >
        <ThunderboltOutlined style={{ fontSize: 20, color: colors.info.text, marginTop: 2 }} />
        <div>
          <p style={{ color: colors.info.text }} className="font-medium">
            How webhooks work
          </p>
          <p style={{ color: colors.text.medium }} className="text-sm mt-1">
            When customers complete checkout, Stripe sends webhook events to your server. These events
            update order status, trigger fulfillment workflows, and keep your inventory in sync. If
            you see failed events, check the Stripe dashboard for detailed error logs.
          </p>
        </div>
      </div>
    </div>
  );
}
