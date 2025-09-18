"use client";

import React from "react";
import { Card, Form, InputNumber, Input, Button, message, Switch, Space } from "antd";
import { useRouter } from "next/navigation";

interface DashboardAlertSettings {
  awaiting_fulfilment_threshold: number;
  low_stock_threshold: number;
  enable_dashboard_alerts?: boolean;
}

interface SlackWebhookSettings {
  ops_alert_webhook?: string | null;
  enable_ops_alerts?: boolean;
}

interface AdminSettingsResponse {
  settings: {
    dashboard_alerts?: DashboardAlertSettings;
    slack_webhooks?: SlackWebhookSettings;
  };
}

export default function AdminSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const router = useRouter();
  const enableOpsAlerts = Form.useWatch(['slack', 'enable_ops_alerts'], form)
  const opsWebhook = Form.useWatch(['slack', 'ops_alert_webhook'], form)

  React.useEffect(() => {
    let mounted = true;
    fetch('/api/admin/settings')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json() as Promise<AdminSettingsResponse>;
      })
      .then((payload) => {
        if (!mounted) return;
        const dashboard = (payload.settings.dashboard_alerts ?? {}) as Partial<DashboardAlertSettings>;
        const slack = (payload.settings.slack_webhooks ?? {}) as Partial<SlackWebhookSettings>;

        form.setFieldsValue({
          alerts: {
            awaiting_fulfilment_threshold: dashboard.awaiting_fulfilment_threshold ?? 3,
            low_stock_threshold: dashboard.low_stock_threshold ?? 5,
            enable_dashboard_alerts: dashboard.enable_dashboard_alerts ?? true,
          },
          slack: {
            enable_ops_alerts: slack.enable_ops_alerts ?? false,
            ops_alert_webhook: slack.ops_alert_webhook ?? '',
          },
        });
      })
      .catch((error) => {
        console.error('Failed to load settings', error);
        message.error('Failed to load settings');
      })
      .finally(() => {
        if (mounted) setInitialLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [form]);

  const handleSubmit = (values: { alerts: DashboardAlertSettings; slack: SlackWebhookSettings }) => {
    setLoading(true);
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dashboard_alerts: values.alerts,
        slack_webhooks: values.slack,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        message.success('Settings saved');
      })
      .catch((error) => {
        console.error('Failed to save settings', error);
        message.error('Failed to save settings');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Alerts" loading={initialLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item label="Enable dashboard alerts" name={['alerts', 'enable_dashboard_alerts']} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Awaiting fulfilment threshold" name={['alerts', 'awaiting_fulfilment_threshold']} rules={[{ required: true, message: 'Enter a threshold' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Low stock threshold" name={['alerts', 'low_stock_threshold']} rules={[{ required: true, message: 'Enter a threshold' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Card title="Slack notifications" size="small" style={{ marginTop: 24 }}>
            <Form.Item label="Enable ops alerts" name={['slack', 'enable_ops_alerts']} valuePropName="checked">
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
            <Form.Item label="Ops alert webhook" name={['slack', 'ops_alert_webhook']} extra="Incoming webhook URL for Slack channel">
              <Input placeholder="https://hooks.slack.com/services/..." />
            </Form.Item>
          </Card>

          <div className="mt-6 flex gap-2">
            <Button type="primary" htmlType="submit" loading={loading}>
              Save settings
            </Button>
            <Button onClick={() => router.refresh()} disabled={loading}>
              Reset
            </Button>
            <Button
              type="default"
              disabled={!enableOpsAlerts || !opsWebhook}
              onClick={() => {
                message.loading({ content: 'Sending Slack test...', key: 'slack-test' })
                fetch('/api/admin/settings/alerts/test', { method: 'POST' })
                  .then(async (res) => {
                    if (!res.ok) {
                      throw new Error(await res.text())
                    }
                    message.success({ content: 'Slack test alert sent', key: 'slack-test' })
                  })
                  .catch((error) => {
                    message.error({ content: `Slack test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, key: 'slack-test' })
                  })
              }}
            >
              Send test alert
            </Button>
          </div>
        </Form>
      </Card>
    </Space>
  );
}
