"use client";

import React from "react";
import { Drawer, Empty, Button, Tabs, Switch, Space } from "antd";
import {
  BellOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { formatDistanceToNow } from "date-fns";
import { colors } from "../theme/tokens";

export interface Notification {
  id: string;
  type: "order" | "inventory" | "system" | "payment";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  severity?: "info" | "warning" | "success" | "error";
}

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

// Hook for managing notifications
function useNotifications(onCountChange?: (count: number) => void) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // Initialize from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("admin-notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(
          parsed.map((n: Notification) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))
        );
      } catch {}
    }

    const soundPref = localStorage.getItem("admin-notification-sound");
    if (soundPref !== null) {
      setSoundEnabled(soundPref === "true");
    }
  }, []);

  // Update count
  React.useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    onCountChange?.(unreadCount);
  }, [notifications, onCountChange]);

  // Persist to localStorage
  React.useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("admin-notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("admin-notifications");
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem("admin-notification-sound", String(newValue));
  };

  const addNotification = React.useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound(notification.type);
    }
  }, [soundEnabled]);

  return {
    notifications,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
    toggleSound,
    addNotification,
  };
}

// Custom notification sound
function playNotificationSound(type: string) {
  // Create AudioContext on demand
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();

    // Different sounds for different notification types
    const frequencies: Record<string, number[]> = {
      order: [523.25, 659.25, 783.99], // C5, E5, G5 - pleasant chime for new orders
      payment: [440, 554.37, 659.25], // A4, C#5, E5 - triumphant for payments
      inventory: [392, 493.88], // G4, B4 - two-tone alert
      system: [440, 440], // A4, A4 - simple beep
    };

    const notes = frequencies[type] || frequencies.system;
    const duration = 0.15;

    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + i * duration);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + i * duration + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + (i + 1) * duration);

      oscillator.start(audioCtx.currentTime + i * duration);
      oscillator.stop(audioCtx.currentTime + (i + 1) * duration + 0.1);
    });
  } catch {
    // Audio not supported
  }
}

function getNotificationIcon(type: string, severity?: string) {
  const iconStyle = { fontSize: 16 };
  const iconColor =
    severity === "error"
      ? colors.danger.text
      : severity === "warning"
      ? colors.warning.text
      : severity === "success"
      ? colors.success.text
      : colors.accent.DEFAULT;

  switch (type) {
    case "order":
      return <ShoppingCartOutlined style={{ ...iconStyle, color: iconColor }} />;
    case "inventory":
      return <InboxOutlined style={{ ...iconStyle, color: iconColor }} />;
    case "payment":
      return <CheckCircleOutlined style={{ ...iconStyle, color: iconColor }} />;
    default:
      return <WarningOutlined style={{ ...iconStyle, color: iconColor }} />;
  }
}

export default function NotificationDrawer({
  open,
  onClose,
  onCountChange,
}: NotificationDrawerProps) {
  const {
    notifications,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
    toggleSound,
  } = useNotifications(onCountChange);

  const [activeTab, setActiveTab] = React.useState("all");

  const filteredNotifications = React.useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellOutlined />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span
                className="px-2 py-0.5 text-xs rounded-full"
                style={{
                  background: colors.danger.text,
                  color: colors.text.high,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <Space>
            <Switch
              size="small"
              checked={soundEnabled}
              onChange={toggleSound}
              checkedChildren={<SoundOutlined />}
              unCheckedChildren={<SoundOutlined />}
            />
          </Space>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={380}
      styles={{
        header: {
          background: colors.bg.elevated1,
          borderBottom: `1px solid ${colors.border.subtle}`,
        },
        body: {
          background: colors.bg.elevated0,
          padding: 0,
        },
      }}
      extra={
        notifications.length > 0 && (
          <Space>
            <Button size="small" type="text" onClick={markAllAsRead}>
              Mark all read
            </Button>
            <Button size="small" type="text" danger onClick={clearAll}>
              Clear all
            </Button>
          </Space>
        )
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        size="small"
        style={{ marginBottom: 0 }}
        items={[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "order", label: "Orders" },
          { key: "inventory", label: "Stock" },
        ]}
      />

      <div
        className="overflow-y-auto"
        style={{ height: "calc(100vh - 160px)" }}
      >
        {filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Empty
              description="No notifications"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: colors.border.subtle }}>
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 hover:bg-white/5 transition-colors cursor-pointer relative group"
                style={{
                  background: notification.read
                    ? "transparent"
                    : colors.primary.ghost,
                }}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                    onClose();
                  }
                }}
              >
                <div className="flex gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.bg.elevated1 }}
                  >
                    {getNotificationIcon(notification.type, notification.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-medium text-sm truncate"
                        style={{ color: colors.text.high }}
                      >
                        {notification.title}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(notification.id);
                        }}
                        style={{ color: colors.text.low }}
                      >
                        <CloseOutlined style={{ fontSize: 12 }} />
                      </button>
                    </div>
                    <p
                      className="text-sm mt-0.5 line-clamp-2"
                      style={{ color: colors.text.medium }}
                    >
                      {notification.message}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: colors.text.low }}
                    >
                      {formatDistanceToNow(notification.timestamp, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                {!notification.read && (
                  <div
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: colors.accent.DEFAULT }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}

// Export the hook for use in realtime integration
export { useNotifications, playNotificationSound };
