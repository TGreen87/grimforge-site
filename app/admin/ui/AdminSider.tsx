"use client";
import React from "react";
import { Layout, Menu, Tooltip } from "antd";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  AppstoreOutlined, TagsOutlined, InboxOutlined, 
  ShoppingCartOutlined, TeamOutlined, FileTextOutlined, FileSearchOutlined,
  LineChartOutlined
} from "@ant-design/icons";

const { Sider } = Layout;

export default function AdminSider({ collapsed = false, onCollapse }: { collapsed?: boolean; onCollapse?: (c:boolean)=>void }) {
  const pathname = usePathname();

  const groups = [
    {
      title: 'Catalog',
      items: [
        { key: '/admin/products', icon: <AppstoreOutlined />, label: 'Products' },
        { key: '/admin/variants', icon: <TagsOutlined />, label: 'Stock Units' },
        { key: '/admin/inventory', icon: <InboxOutlined />, label: 'Inventory' },
      ],
    },
    {
      title: 'Commerce',
      items: [
        { key: '/admin/orders', icon: <ShoppingCartOutlined />, label: 'Orders' },
        { key: '/admin/customers', icon: <TeamOutlined />, label: 'Customers' },
      ],
    },
    {
      title: 'Content',
      items: [ { key: '/admin/articles', icon: <FileTextOutlined />, label: 'Articles' } ],
    },
    {
      title: 'System',
      items: [
        { key: '/admin/analytics', icon: <LineChartOutlined />, label: 'Analytics' },
        { key: '/admin/audit-logs', icon: <FileSearchOutlined />, label: 'Audit Logs' }
      ],
    }
  ];

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={onCollapse} collapsedWidth={72} theme="dark" width={248} style={{ background: "#0f0f0f" }}>
      <div className="px-3 py-4 text-center text-bone/80 text-sm border-b border-border">Grimforge Admin</div>
      <div className="px-2 py-2 space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            {!collapsed && <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-[var(--clr-text-low)]">{g.title}</div>}
            <Menu theme="dark" mode="inline" selectedKeys={[pathname || '']}
              items={g.items.map((it) => ({
                key: it.key,
                icon: it.icon,
                label: collapsed ? (
                  <Tooltip placement="right" title={`${it.label}`}>
                    <Link href={it.key}>{it.label}</Link>
                  </Tooltip>
                ) : (
                  <Link href={it.key}>{it.label}</Link>
                ),
              }))}
            />
          </div>
        ))}
      </div>
    </Sider>
  );
}
