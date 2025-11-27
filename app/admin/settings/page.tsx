"use client";

import React from "react";
import {
  Form,
  InputNumber,
  Input,
  Button,
  message,
  Switch,
  Select,
  Skeleton,
  Tooltip,
} from "antd";
import {
  BellOutlined,
  DollarOutlined,
  SlackOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  SaveOutlined,
  ReloadOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { colors } from "../theme/tokens";

interface DashboardAlertSettings {
  awaiting_fulfilment_threshold: number;
  low_stock_threshold: number;
  enable_dashboard_alerts?: boolean;
}

interface SlackWebhookSettings {
  ops_alert_webhook?: string | null;
  enable_ops_alerts?: boolean;
}

interface RevenueGoalSettings {
  target: number;
  period: "7d" | "30d";
}

interface AdminSettingsResponse {
  settings: {
    dashboard_alerts?: DashboardAlertSettings;
    slack_webhooks?: SlackWebhookSettings;
    dashboard_revenue_goal?: RevenueGoalSettings;
  };
}

// Reusable section card component
function SettingsSection({
  icon,
  title,
  description,
  accentColor,
  children,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: colors.bg.elevated0,
        border: `1px solid ${colors.border.subtle}`,
      }}
    >
      {/* Section header */}
      <div
        className="px-6 py-4 flex items-start gap-4 relative"
        style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
      >
        {/* Accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }}
        />

        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `${accentColor}15`,
            color: accentColor,
          }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-base font-semibold"
              style={{ color: colors.text.high }}
            >
              {title}
            </h3>
            {badge}
          </div>
          <p className="text-sm mt-0.5" style={{ color: colors.text.medium }}>
            {description}
          </p>
        </div>
      </div>

      {/* Section content */}
      <div className="p-6">{children}</div>
    </div>
  );
}

// Form field wrapper with better styling
function SettingsField({
  label,
  help,
  children,
  inline = false,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div
        className="flex items-center justify-between py-3 border-b last:border-b-0"
        style={{ borderColor: colors.border.subtle }}
      >
        <div>
          <div className="font-medium" style={{ color: colors.text.high }}>
            {label}
          </div>
          {help && (
            <div className="text-xs mt-0.5" style={{ color: colors.text.low }}>
              {help}
            </div>
          )}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium" style={{ color: colors.text.high }}>
          {label}
        </label>
        {help && (
          <Tooltip title={help}>
            <InfoCircleOutlined
              style={{ color: colors.text.low, fontSize: 12, cursor: "help" }}
            />
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [hasChanges, setHasChanges] = React.useState(false);
  const router = useRouter();

  const enableOpsAlerts = Form.useWatch(["slack", "enable_ops_alerts"], form);
  const opsWebhook = Form.useWatch(["slack", "ops_alert_webhook"], form);
  const enableDashboardAlerts = Form.useWatch(
    ["alerts", "enable_dashboard_alerts"],
    form
  );

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/admin/settings")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json() as Promise<AdminSettingsResponse>;
      })
      .then((payload) => {
        if (!mounted) return;
        const dashboard = (payload.settings.dashboard_alerts ??
          {}) as Partial<DashboardAlertSettings>;
        const slack = (payload.settings.slack_webhooks ??
          {}) as Partial<SlackWebhookSettings>;

        form.setFieldsValue({
          alerts: {
            awaiting_fulfilment_threshold:
              dashboard.awaiting_fulfilment_threshold ?? 3,
            low_stock_threshold: dashboard.low_stock_threshold ?? 5,
            enable_dashboard_alerts: dashboard.enable_dashboard_alerts ?? true,
          },
          slack: {
            enable_ops_alerts: slack.enable_ops_alerts ?? false,
            ops_alert_webhook: slack.ops_alert_webhook ?? "",
          },
          revenue: {
            target:
              (
                payload.settings.dashboard_revenue_goal as
                  | RevenueGoalSettings
                  | undefined
              )?.target ?? 5000,
            period:
              (
                payload.settings.dashboard_revenue_goal as
                  | RevenueGoalSettings
                  | undefined
              )?.period ?? "30d",
          },
        });
      })
      .catch((error) => {
        console.error("Failed to load settings", error);
        message.error("Failed to load settings");
      })
      .finally(() => {
        if (mounted) setInitialLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [form]);

  const handleSubmit = (values: {
    alerts: DashboardAlertSettings;
    slack: SlackWebhookSettings;
    revenue: RevenueGoalSettings;
  }) => {
    setLoading(true);
    fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dashboard_alerts: values.alerts,
        slack_webhooks: values.slack,
        dashboard_revenue_goal: values.revenue,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        message.success({
          content: "Settings saved successfully",
          icon: <CheckCircleOutlined style={{ color: colors.success.text }} />,
        });
        setHasChanges(false);
      })
      .catch((error) => {
        console.error("Failed to save settings", error);
        message.error("Failed to save settings");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleTestSlack = () => {
    message.loading({ content: "Sending test alert to Slack...", key: "slack-test" });
    fetch("/api/admin/settings/alerts/test", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        message.success({
          content: "Test alert sent to Slack!",
          key: "slack-test",
          icon: <CheckCircleOutlined style={{ color: colors.success.text }} />,
        });
      })
      .catch((error) => {
        message.error({
          content: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          key: "slack-test",
        });
      });
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton.Input active style={{ width: 200, height: 32 }} />
          <Skeleton.Input active style={{ width: 300, height: 20, marginTop: 8 }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl p-6"
            style={{ background: colors.bg.elevated0 }}
          >
            <Skeleton active />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold flex items-center gap-3"
            style={{
              fontFamily: "var(--font-gothic), 'Cinzel', serif",
              color: colors.text.high,
            }}
          >
            <SettingOutlined style={{ color: colors.accent.DEFAULT }} />
            Settings
          </h1>
          <p style={{ color: colors.text.medium }} className="mt-1">
            Configure alerts, integrations, and business goals
          </p>
        </div>

        {/* Save indicator */}
        {hasChanges && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
            style={{
              background: colors.warning.bg,
              border: `1px solid ${colors.warning.border}`,
              color: colors.warning.text,
            }}
          >
            <WarningOutlined />
            Unsaved changes
          </div>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={() => setHasChanges(true)}
      >
        {/* Revenue Goals Section */}
        <SettingsSection
          icon={<DollarOutlined style={{ fontSize: 18 }} />}
          title="Revenue Goals"
          description="Set targets to track your business performance on the dashboard"
          accentColor={colors.success.text}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <SettingsField
              label="Revenue Target"
              help="The revenue amount you're aiming to achieve"
            >
              <Form.Item
                name={["revenue", "target"]}
                rules={[{ required: true, message: "Enter a goal" }]}
                noStyle
              >
                <InputNumber
                  min={0}
                  step={100}
                  style={{ width: "100%" }}
                  prefix={<span style={{ color: colors.text.low }}>$</span>}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                />
              </Form.Item>
            </SettingsField>

            <SettingsField
              label="Tracking Period"
              help="Timeframe for measuring progress toward your goal"
            >
              <Form.Item
                name={["revenue", "period"]}
                rules={[{ required: true, message: "Select a period" }]}
                noStyle
              >
                <Select
                  style={{ width: "100%" }}
                  options={[
                    { label: "Last 7 days", value: "7d" },
                    { label: "Last 30 days", value: "30d" },
                  ]}
                />
              </Form.Item>
            </SettingsField>
          </div>
        </SettingsSection>

        {/* Dashboard Alerts Section */}
        <SettingsSection
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          title="Dashboard Alerts"
          description="Get notified when orders need attention or stock is running low"
          accentColor={colors.warning.text}
          badge={
            enableDashboardAlerts ? (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: colors.success.bg,
                  color: colors.success.text,
                }}
              >
                Active
              </span>
            ) : (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: colors.bg.elevated2,
                  color: colors.text.low,
                }}
              >
                Disabled
              </span>
            )
          }
        >
          <div className="space-y-0">
            <SettingsField
              label="Enable Dashboard Alerts"
              help="Show alert banners on dashboard when thresholds are exceeded"
              inline
            >
              <Form.Item
                name={["alerts", "enable_dashboard_alerts"]}
                valuePropName="checked"
                noStyle
              >
                <Switch />
              </Form.Item>
            </SettingsField>

            <SettingsField
              label="Fulfillment Alert Threshold"
              help="Alert when this many orders are awaiting fulfillment"
              inline
            >
              <Form.Item
                name={["alerts", "awaiting_fulfilment_threshold"]}
                rules={[{ required: true, message: "Required" }]}
                noStyle
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: 80 }}
                  disabled={!enableDashboardAlerts}
                />
              </Form.Item>
            </SettingsField>

            <SettingsField
              label="Low Stock Threshold"
              help="Alert when variant stock falls below this level"
              inline
            >
              <Form.Item
                name={["alerts", "low_stock_threshold"]}
                rules={[{ required: true, message: "Required" }]}
                noStyle
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: 80 }}
                  disabled={!enableDashboardAlerts}
                />
              </Form.Item>
            </SettingsField>
          </div>
        </SettingsSection>

        {/* Slack Integration Section */}
        <SettingsSection
          icon={<SlackOutlined style={{ fontSize: 18 }} />}
          title="Slack Notifications"
          description="Receive real-time alerts in your Slack workspace"
          accentColor="#E01E5A"
          badge={
            enableOpsAlerts && opsWebhook ? (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: colors.success.bg,
                  color: colors.success.text,
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: colors.bg.elevated2,
                  color: colors.text.low,
                }}
              >
                Not configured
              </span>
            )
          }
        >
          <div className="space-y-4">
            <SettingsField
              label="Enable Slack Alerts"
              help="Send order and inventory alerts to Slack"
              inline
            >
              <Form.Item
                name={["slack", "enable_ops_alerts"]}
                valuePropName="checked"
                noStyle
              >
                <Switch />
              </Form.Item>
            </SettingsField>

            <SettingsField
              label="Webhook URL"
              help="Create an incoming webhook in your Slack workspace"
            >
              <Form.Item name={["slack", "ops_alert_webhook"]} noStyle>
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  disabled={!enableOpsAlerts}
                  style={{
                    background: enableOpsAlerts
                      ? colors.bg.elevated1
                      : colors.bg.elevated0,
                  }}
                />
              </Form.Item>
            </SettingsField>

            {enableOpsAlerts && opsWebhook && (
              <Button
                icon={<SendOutlined />}
                onClick={handleTestSlack}
                style={{
                  background: colors.bg.elevated1,
                  borderColor: colors.border.DEFAULT,
                  color: colors.text.high,
                }}
              >
                Send Test Alert
              </Button>
            )}
          </div>
        </SettingsSection>

        {/* Action Buttons */}
        <div
          className="flex items-center justify-between p-4 rounded-xl sticky bottom-4"
          style={{
            background: colors.bg.elevated1,
            border: `1px solid ${colors.border.DEFAULT}`,
            boxShadow: `0 -4px 20px ${colors.bg.base}`,
          }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: colors.text.low }}>
            <ThunderboltOutlined />
            Changes are applied immediately after saving
          </div>

          <div className="flex gap-3">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                router.refresh();
                setHasChanges(false);
              }}
              disabled={loading}
              style={{
                background: "transparent",
                borderColor: colors.border.DEFAULT,
                color: colors.text.medium,
              }}
            >
              Reset
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
              style={{
                background: hasChanges ? colors.primary.DEFAULT : colors.bg.elevated2,
                borderColor: hasChanges ? colors.primary.DEFAULT : colors.border.DEFAULT,
              }}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}
