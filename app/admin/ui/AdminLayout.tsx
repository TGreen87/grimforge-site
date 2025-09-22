"use client";
import React from "react";
import { Layout } from "antd";
import AdminHeader from "../ui/AdminHeader";
import AdminSider from "../ui/AdminSider";
import AdminAssistantDrawer from "../ui/AdminAssistantDrawer";

const { Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [assistantOpen, setAssistantOpen] = React.useState(false);
  return (
    <Layout style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded">
        Skip to content
      </a>
      <AdminSider collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <AdminHeader onOpenAssistant={() => setAssistantOpen(true)} />
        <Content id="admin-content" style={{ margin: 16 }}>
          <div style={{ padding: 16, background: "#0a0a0a" }}>
            {children}
          </div>
        </Content>
      </Layout>
      <AdminAssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </Layout>
  );
}
