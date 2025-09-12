"use client";
import React from "react";
import { Layout } from "antd";
import AdminHeader from "../ui/AdminHeader";
import AdminSider from "../ui/AdminSider";

const { Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <AdminSider />
      <Layout>
        <AdminHeader />
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 16, background: "#0a0a0a" }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

