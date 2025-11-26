"use client";

import React from "react";
import { Layout, Menu, Tooltip, Badge } from "antd";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AppstoreOutlined,
  TagsOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  DashboardOutlined,
  SettingOutlined,
  NotificationOutlined,
  BookOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { colors } from "../theme/tokens";

const { Sider } = Layout;

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeStatus?: "success" | "warning" | "danger";
}

interface NavGroup {
  title: string;
  icon?: React.ReactNode;
  items: NavItem[];
}

// Hook to fetch live counts for badges
function useNavBadges() {
  const [badges, setBadges] = React.useState<{
    pendingOrders: number;
    lowStock: number;
  }>({ pendingOrders: 0, lowStock: 0 });

  React.useEffect(() => {
    // Fetch initial counts
    async function fetchCounts() {
      try {
        const res = await fetch("/api/admin/nav-counts");
        if (res.ok) {
          const data = await res.json();
          setBadges({
            pendingOrders: data.pendingOrders || 0,
            lowStock: data.lowStock || 0,
          });
        }
      } catch {
        // Silently fail - badges are non-critical
      }
    }

    fetchCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return badges;
}

export default function AdminSider({
  collapsed = false,
  onCollapse,
}: {
  collapsed?: boolean;
  onCollapse?: (c: boolean) => void;
}) {
  const pathname = usePathname();
  const badges = useNavBadges();

  const navGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        {
          key: "/admin/dashboard",
          icon: <DashboardOutlined />,
          label: "Dashboard",
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          key: "/admin/orders",
          icon: <ShoppingCartOutlined />,
          label: "Orders",
          badge: badges.pendingOrders,
          badgeStatus: "warning",
        },
        {
          key: "/admin/customers",
          icon: <TeamOutlined />,
          label: "Customers",
        },
        {
          key: "/admin/inventory",
          icon: <InboxOutlined />,
          label: "Inventory",
          badge: badges.lowStock,
          badgeStatus: "danger",
        },
      ],
    },
    {
      title: "Catalog",
      items: [
        {
          key: "/admin/products",
          icon: <AppstoreOutlined />,
          label: "Products",
        },
        {
          key: "/admin/variants",
          icon: <TagsOutlined />,
          label: "Stock Units",
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          key: "/admin/campaigns",
          icon: <NotificationOutlined />,
          label: "Campaigns",
        },
        {
          key: "/admin/articles",
          icon: <FileTextOutlined />,
          label: "Articles",
        },
        {
          key: "/admin/story",
          icon: <BookOutlined />,
          label: "Story",
        },
      ],
    },
    {
      title: "Analytics",
      items: [
        {
          key: "/admin/analytics",
          icon: <LineChartOutlined />,
          label: "Reports",
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          key: "/admin/settings",
          icon: <SettingOutlined />,
          label: "Settings",
        },
        {
          key: "/admin/audit-logs",
          icon: <FileSearchOutlined />,
          label: "Audit Logs",
        },
        {
          key: "/admin/webhooks",
          icon: <ApiOutlined />,
          label: "Webhooks",
        },
        {
          key: "/admin/assistant/logs",
          icon: <ThunderboltOutlined />,
          label: "Assistant",
        },
      ],
    },
  ];

  const getBadgeColor = (status?: string) => {
    switch (status) {
      case "success":
        return colors.success.text;
      case "warning":
        return colors.warning.text;
      case "danger":
        return colors.danger.text;
      default:
        return colors.accent.DEFAULT;
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      collapsedWidth={64}
      theme="dark"
      width={240}
      className="admin-sider"
      trigger={null}
      style={{
        background: `linear-gradient(180deg, ${colors.bg.elevated0} 0%, ${colors.bg.base} 100%)`,
        borderRight: `1px solid ${colors.border.subtle}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Logo / Brand */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: colors.border.subtle }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary.DEFAULT} 0%, ${colors.primary.active} 100%)`,
                boxShadow: `0 0 12px ${colors.primary.DEFAULT}40`,
              }}
            >
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}>
                O
              </span>
            </div>
            <div>
              <div
                className="text-sm font-semibold"
                style={{
                  color: colors.text.high,
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: "0.02em",
                }}
              >
                Obsidian Rite
              </div>
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{ color: colors.text.low }}
              >
                Admin
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg mx-auto"
            style={{
              background: `linear-gradient(135deg, ${colors.primary.DEFAULT} 0%, ${colors.primary.active} 100%)`,
              boxShadow: `0 0 12px ${colors.primary.DEFAULT}40`,
            }}
          >
            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}>
              O
            </span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => onCollapse?.(!collapsed)}
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            style={{ color: colors.text.low }}
          >
            <MenuFoldOutlined />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div
        className="overflow-y-auto py-3"
        style={{ height: "calc(100vh - 120px)" }}
      >
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {/* Group Header */}
            {!collapsed && (
              <div className="admin-nav-group-header">
                <span>{group.title}</span>
              </div>
            )}

            {/* Menu Items */}
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname || ""]}
              style={{ background: "transparent", border: "none" }}
              items={group.items.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: collapsed ? (
                  <Tooltip placement="right" title={item.label}>
                    <Link href={item.key}>{item.label}</Link>
                  </Tooltip>
                ) : (
                  <Link
                    href={item.key}
                    className="flex items-center justify-between w-full"
                  >
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span
                        className="admin-nav-badge"
                        style={{
                          background: getBadgeColor(item.badgeStatus),
                          marginLeft: 8,
                        }}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </Link>
                ),
              }))}
            />
          </div>
        ))}
      </div>

      {/* Collapse Toggle (when collapsed) */}
      {collapsed && (
        <div
          className="absolute bottom-0 left-0 right-0 p-3 border-t"
          style={{ borderColor: colors.border.subtle }}
        >
          <button
            onClick={() => onCollapse?.(!collapsed)}
            className="w-full p-2 rounded hover:bg-white/5 transition-colors flex items-center justify-center"
            style={{ color: colors.text.medium }}
          >
            <MenuUnfoldOutlined />
          </button>
        </div>
      )}

      {/* Environment Indicator */}
      {!collapsed && (
        <div
          className="absolute bottom-0 left-0 right-0 p-3 border-t"
          style={{
            borderColor: colors.border.subtle,
            background: colors.bg.base,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="admin-status-dot pulse"
              style={{ background: colors.success.text }}
            />
            <span
              className="text-xs"
              style={{ color: colors.text.low }}
            >
              {process.env.NODE_ENV === "production" ? "Production" : "Development"}
            </span>
          </div>
        </div>
      )}
    </Sider>
  );
}
