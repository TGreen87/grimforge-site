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
  Slider,
  Space,
  Tag,
  Spin,
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
  SoundOutlined,
  AudioOutlined,
  PlayCircleOutlined,
  RobotOutlined,
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

// Voice settings - stored in localStorage (client-side preference)
interface VoiceSettings {
  enabled: boolean;
  voice_id: string;
  voice_name: string;
  model_id: "eleven_flash_v2_5" | "eleven_turbo_v2_5" | "eleven_multilingual_v2";
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  auto_play: boolean;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  labels: Record<string, string>;
  preview_url?: string;
  recommended: boolean;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  voice_id: "JBFqnCBsd6RMkjVDRZzb",
  voice_name: "George",
  model_id: "eleven_flash_v2_5",
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  speed: 1.0,
  auto_play: false,
};

const TTS_MODELS = [
  {
    value: "eleven_flash_v2_5",
    label: "Flash v2.5 (Fastest)",
    description: "~75ms latency, great for interactive use",
  },
  {
    value: "eleven_turbo_v2_5",
    label: "Turbo v2.5 (Balanced)",
    description: "Better quality, slightly slower",
  },
  {
    value: "eleven_multilingual_v2",
    label: "Multilingual v2 (Best)",
    description: "Highest quality, 29 languages",
  },
];

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

  // Voice settings state (client-side, localStorage)
  const [voiceSettings, setVoiceSettings] = React.useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [voices, setVoices] = React.useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = React.useState(false);
  const [voiceTestPlaying, setVoiceTestPlaying] = React.useState(false);
  const [previewPlaying, setPreviewPlaying] = React.useState<string | null>(null);

  const enableOpsAlerts = Form.useWatch(["slack", "enable_ops_alerts"], form);
  const opsWebhook = Form.useWatch(["slack", "ops_alert_webhook"], form);
  const enableDashboardAlerts = Form.useWatch(
    ["alerts", "enable_dashboard_alerts"],
    form
  );

  // Load voice settings from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("copilot_voice_settings");
      if (saved) {
        try {
          setVoiceSettings({ ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) });
        } catch {}
      }
    }
  }, []);

  // Fetch voices when voice settings are enabled
  React.useEffect(() => {
    if (!voiceSettings.enabled) return;
    if (voices.length > 0) return; // Already loaded

    async function fetchVoices() {
      setVoicesLoading(true);
      try {
        const response = await fetch("/api/admin/voice/voices", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setVoices(data.voices || []);
        }
      } catch (error) {
        console.error("Failed to fetch voices:", error);
      } finally {
        setVoicesLoading(false);
      }
    }

    fetchVoices();
  }, [voiceSettings.enabled, voices.length]);

  // Save voice settings to localStorage
  function saveVoiceSettings(newSettings: VoiceSettings) {
    setVoiceSettings(newSettings);
    localStorage.setItem("copilot_voice_settings", JSON.stringify(newSettings));
    message.success("Voice settings saved");
  }

  // Play voice preview
  function playPreview(voice: Voice) {
    if (!voice.preview_url) return;

    if (previewPlaying === voice.voice_id) {
      setPreviewPlaying(null);
      return;
    }

    setPreviewPlaying(voice.voice_id);
    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPreviewPlaying(null);
    audio.onerror = () => setPreviewPlaying(null);
    audio.play();
  }

  // Test current voice with TTS
  async function testVoice() {
    setVoiceTestPlaying(true);
    try {
      const response = await fetch("/api/admin/voice/tts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "G'day mate! I'm your Obsidian Rite Records copilot. Ready to help with products, orders, and marketing.",
          voice_id: voiceSettings.voice_id,
          model_id: voiceSettings.model_id,
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: voiceSettings.style,
          speed: voiceSettings.speed,
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setVoiceTestPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => setVoiceTestPlaying(false);
      audio.play();
    } catch (error) {
      console.error("Test voice failed:", error);
      message.error("Failed to test voice");
      setVoiceTestPlaying(false);
    }
  }

  function handleVoiceSelect(voice_id: string) {
    const voice = voices.find((v) => v.voice_id === voice_id);
    const newSettings = {
      ...voiceSettings,
      voice_id,
      voice_name: voice?.name || "Unknown",
    };
    setVoiceSettings(newSettings);
    localStorage.setItem("copilot_voice_settings", JSON.stringify(newSettings));
  }

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

        {/* Voice & Copilot Section - Outside the Form since it uses localStorage */}
        <SettingsSection
          icon={<SoundOutlined style={{ fontSize: 18 }} />}
          title="Copilot Voice Assistant"
          description="Talk to your admin copilot using natural speech with ElevenLabs AI"
          accentColor="#8B0000"
          badge={
            voiceSettings.enabled ? (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: colors.success.bg,
                  color: colors.success.text,
                }}
              >
                Enabled
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
          <div className="space-y-4">
            {/* Quick Launch Copilot */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.bg.elevated1} 0%, ${colors.bg.elevated0} 100%)`,
                border: `1px solid ${colors.border.subtle}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, #8B0000 0%, #5c0000 100%)`,
                    boxShadow: "0 0 12px rgba(139, 0, 0, 0.4)",
                  }}
                >
                  <RobotOutlined style={{ color: "white", fontSize: 20 }} />
                </div>
                <div>
                  <div className="font-medium" style={{ color: colors.text.high }}>
                    Admin Copilot
                  </div>
                  <div className="text-xs" style={{ color: colors.text.low }}>
                    Press <Tag style={{ fontSize: 10, margin: 0 }}>⌘⇧C</Tag> or click the robot icon in the header
                  </div>
                </div>
              </div>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                style={{ background: "#8B0000", borderColor: "#8B0000" }}
                onClick={() => {
                  // Trigger the keyboard shortcut
                  const event = new KeyboardEvent("keydown", {
                    key: "c",
                    metaKey: true,
                    shiftKey: true,
                    bubbles: true,
                  });
                  window.dispatchEvent(event);
                }}
              >
                Open Copilot
              </Button>
            </div>

            {/* Enable Voice */}
            <SettingsField
              label="Enable Voice Assistant"
              help="Use ElevenLabs for high-quality text-to-speech and speech-to-text"
              inline
            >
              <Switch
                checked={voiceSettings.enabled}
                onChange={(enabled) => saveVoiceSettings({ ...voiceSettings, enabled })}
              />
            </SettingsField>

            {voiceSettings.enabled && (
              <>
                {/* Voice Selection */}
                <SettingsField
                  label="Voice"
                  help="Choose your copilot's voice personality"
                >
                  <Select
                    value={voiceSettings.voice_id}
                    onChange={handleVoiceSelect}
                    loading={voicesLoading}
                    style={{ width: "100%" }}
                    optionLabelProp="label"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {voices.map((voice) => (
                      <Select.Option
                        key={voice.voice_id}
                        value={voice.voice_id}
                        label={voice.name}
                      >
                        <div className="flex items-center justify-between py-1">
                          <div>
                            <span style={{ fontWeight: 500 }}>{voice.name}</span>
                            {voice.recommended && (
                              <Tag
                                color="gold"
                                style={{ marginLeft: 8, fontSize: 10 }}
                              >
                                Recommended
                              </Tag>
                            )}
                            <div
                              className="text-xs"
                              style={{ color: colors.text.low }}
                            >
                              {voice.description ||
                                Object.values(voice.labels || {}).join(", ")}
                            </div>
                          </div>
                          {voice.preview_url && (
                            <Button
                              type="text"
                              size="small"
                              icon={<PlayCircleOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                playPreview(voice);
                              }}
                              style={{
                                color:
                                  previewPlaying === voice.voice_id
                                    ? "#8B0000"
                                    : colors.text.medium,
                              }}
                            />
                          )}
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </SettingsField>

                {/* Quality Model */}
                <SettingsField
                  label="Quality Model"
                  help="Balance between speed and voice quality"
                >
                  <Select
                    value={voiceSettings.model_id}
                    onChange={(model_id) =>
                      saveVoiceSettings({ ...voiceSettings, model_id })
                    }
                    style={{ width: "100%" }}
                  >
                    {TTS_MODELS.map((model) => (
                      <Select.Option key={model.value} value={model.value}>
                        <div>
                          <span>{model.label}</span>
                          <div
                            className="text-xs"
                            style={{ color: colors.text.low }}
                          >
                            {model.description}
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </SettingsField>

                {/* Voice Tuning */}
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: colors.bg.elevated1,
                    border: `1px solid ${colors.border.subtle}`,
                  }}
                >
                  <div
                    className="text-sm font-medium mb-4"
                    style={{ color: colors.text.high }}
                  >
                    Voice Tuning
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: colors.text.medium }}>Stability</span>
                        <span style={{ color: colors.text.low }}>
                          {voiceSettings.stability.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={voiceSettings.stability}
                        onChange={(stability) =>
                          setVoiceSettings({ ...voiceSettings, stability })
                        }
                        onChangeComplete={(stability) =>
                          saveVoiceSettings({ ...voiceSettings, stability })
                        }
                      />
                      <div className="text-xs" style={{ color: colors.text.low }}>
                        Higher = more consistent, Lower = more expressive
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: colors.text.medium }}>
                          Similarity Boost
                        </span>
                        <span style={{ color: colors.text.low }}>
                          {voiceSettings.similarity_boost.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.05}
                        value={voiceSettings.similarity_boost}
                        onChange={(similarity_boost) =>
                          setVoiceSettings({ ...voiceSettings, similarity_boost })
                        }
                        onChangeComplete={(similarity_boost) =>
                          saveVoiceSettings({ ...voiceSettings, similarity_boost })
                        }
                      />
                      <div className="text-xs" style={{ color: colors.text.low }}>
                        How closely to match the original voice
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: colors.text.medium }}>Speed</span>
                        <span style={{ color: colors.text.low }}>
                          {voiceSettings.speed.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={voiceSettings.speed}
                        onChange={(speed) =>
                          setVoiceSettings({ ...voiceSettings, speed })
                        }
                        onChangeComplete={(speed) =>
                          saveVoiceSettings({ ...voiceSettings, speed })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-play */}
                <SettingsField
                  label="Auto-play Responses"
                  help="Automatically read assistant messages aloud"
                  inline
                >
                  <Switch
                    checked={voiceSettings.auto_play}
                    onChange={(auto_play) =>
                      saveVoiceSettings({ ...voiceSettings, auto_play })
                    }
                  />
                </SettingsField>

                {/* Test Voice Button */}
                <div className="flex items-center gap-3">
                  <Button
                    icon={<PlayCircleOutlined />}
                    onClick={testVoice}
                    loading={voiceTestPlaying}
                    style={{
                      background: colors.bg.elevated1,
                      borderColor: colors.border.DEFAULT,
                      color: colors.text.high,
                    }}
                  >
                    Test Voice
                  </Button>
                  <span className="text-xs" style={{ color: colors.text.low }}>
                    Hear how your copilot will sound
                  </span>
                </div>
              </>
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
