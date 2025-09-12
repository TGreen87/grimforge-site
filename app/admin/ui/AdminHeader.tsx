"use client";
import React from "react";
import { Layout, Breadcrumb, Input, Space, Dropdown, Avatar } from "antd";
import { usePathname } from "next/navigation";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
// Attempt to programmatically toggle Refine Kbar palette when search is clicked
let kbarQuery: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const kbar = require('kbar');
  kbarQuery = kbar.useKBar ? kbar.useKBar().query : null;
} catch {}

const { Header } = Layout;

function useBreadcrumb() {
  const pathname = usePathname() || "/admin";
  const parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const items = [] as Array<{ title: string; href?: string }>;
  let acc = "";
  for (const p of parts) {
    acc += `/${p}`;
    items.push({ title: p.replace(/\[|\]|\(.*\)/g, "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()), href: acc });
  }
  return items;
}

export default function AdminHeader() {
  const crumbs = useBreadcrumb();
  const menu = {
    items: [
      { key: 'profile', label: 'Profile' },
      { key: 'logout', label: 'Logout' },
    ],
  } as any;

  return (
    <Header style={{ background: "linear-gradient(90deg,#0f0f0f,#111827)", borderBottom: "1px solid #1f2937" }}>
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb
          items={crumbs.map((c, i) => ({ title: <a href={c.href}>{c.title}</a> }))}
        />
        <Space size="middle">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search (K)"
            style={{ width: 300 }}
            onFocus={() => {
              try {
                if (kbarQuery && typeof kbarQuery.toggle === 'function') {
                  kbarQuery.toggle();
                  return;
                }
                // Fallback: dispatch meta+K keydown to trigger palette
                const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(ev);
              } catch {}
            }}
            onClick={(e) => {
              (e.target as HTMLInputElement).blur();
              try {
                if (kbarQuery && typeof kbarQuery.toggle === 'function') {
                  kbarQuery.toggle();
                } else {
                  const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                  window.dispatchEvent(ev);
                }
              } catch {}
            }}
            readOnly
          />
          <Dropdown menu={menu} trigger={["click"]}>
            <Avatar style={{ backgroundColor: "#8B0000" }} icon={<UserOutlined />} />
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
}
