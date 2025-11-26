"use client";

import React from "react";
import { Layout } from "antd";
import AdminHeader from "./AdminHeader";
import AdminSider from "./AdminSider";
import AdminAssistantDrawer from "./AdminAssistantDrawer";
import NotificationDrawer from "./NotificationDrawer";
import { colors } from "../theme/tokens";

const { Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [assistantOpen, setAssistantOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(0);

  // Keyboard shortcut for notifications
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNotificationsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh", background: colors.bg.base }}>
      {/* Skip link for accessibility */}
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-sm"
        style={{
          background: colors.primary.DEFAULT,
          color: colors.text.high,
        }}
      >
        Skip to content
      </a>

      {/* Sidebar */}
      <AdminSider collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main content area */}
      <Layout style={{ background: colors.bg.base }}>
        <AdminHeader
          onOpenAssistant={() => setAssistantOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          notificationCount={notificationCount}
        />

        <Content
          id="admin-content"
          className="admin-content"
          style={{
            margin: 0,
            padding: 24,
            minHeight: "calc(100vh - 56px)",
            background: colors.bg.base,
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* Drawers */}
      <AdminAssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

      <NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onCountChange={setNotificationCount}
      />
    </Layout>
  );
}
