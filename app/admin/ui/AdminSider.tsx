"use client";
import React from "react";
import { Layout, Menu } from "antd";
import { useMenu } from "@refinedev/core";
import Link from "next/link";

const { Sider } = Layout;

export default function AdminSider() {
  const { menuItems } = useMenu();

  return (
    <Sider breakpoint="lg" collapsedWidth={64} theme="dark" width={240} style={{ background: "#0f0f0f" }}>
      <div className="px-3 py-4 text-center text-bone/80 text-sm border-b border-border">Grimforge Admin</div>
      <Menu theme="dark" mode="inline" defaultSelectedKeys={[menuItems?.[0]?.key || "/admin"]}
        items={menuItems.map((item) => ({
          key: item.key || item.name,
          icon: item.icon,
          label: <Link href={item.route || "/admin"}>{item.label}</Link>,
        }))}
      />
    </Sider>
  );
}

