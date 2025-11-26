"use client";

import React from "react";
import {
  Layout,
  Breadcrumb,
  Input,
  Space,
  Dropdown,
  Avatar,
  Button,
  Tooltip,
  Badge,
} from "antd";
import { usePathname, useRouter } from "next/navigation";
import {
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  InboxOutlined,
  FileTextOutlined,
  RobotOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { colors } from "../theme/tokens";

const { Header } = Layout;

function useBreadcrumb() {
  const pathname = usePathname() || "/admin";
  const parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
  const items = [] as Array<{ title: string; href?: string }>;
  let acc = "";
  for (const p of parts) {
    acc += `/${p}`;
    items.push({
      title: p
        .replace(/\[|\]|\(.*\)/g, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase()),
      href: acc,
    });
  }
  return items;
}

interface AdminHeaderProps {
  onOpenAssistant?: () => void;
  onOpenNotifications?: () => void;
  notificationCount?: number;
}

export default function AdminHeader({
  onOpenAssistant,
  onOpenNotifications,
  notificationCount = 0,
}: AdminHeaderProps) {
  const crumbs = useBreadcrumb();
  const router = useRouter();

  // Keyboard shortcuts for navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "1") router.push("/admin/products");
      if (e.key === "2") router.push("/admin/inventory");
      if (e.key === "3") router.push("/admin/orders");
      if (e.key === "4") router.push("/admin/customers");
      if (e.key === "5") router.push("/admin/articles");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  // Assistant shortcut
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        onOpenAssistant?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenAssistant]);

  const userMenuItems = [
    {
      key: "settings",
      label: "Settings",
      icon: <SettingOutlined />,
      onClick: () => router.push("/admin/settings"),
    },
    { type: "divider" as const },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        // Will trigger auth provider logout
        window.location.href = "/admin/login?logout=true";
      },
    },
  ];

  const quickActions = [
    {
      key: "product",
      label: "New Product",
      icon: <PlusOutlined />,
      shortcut: "n p",
      onClick: () => router.push("/admin/products/create"),
    },
    {
      key: "stock",
      label: "Receive Stock",
      icon: <InboxOutlined />,
      shortcut: "r s",
      onClick: () => router.push("/admin/inventory"),
    },
    {
      key: "article",
      label: "New Article",
      icon: <FileTextOutlined />,
      shortcut: "n a",
      onClick: () => router.push("/admin/articles/create"),
    },
  ];

  return (
    <Header
      className="admin-header"
      style={{
        background: colors.bg.elevated0,
        borderBottom: `1px solid ${colors.border.subtle}`,
        padding: "0 24px",
        height: 56,
        lineHeight: "56px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="flex items-center justify-between gap-4 h-full">
        {/* Breadcrumb */}
        <Breadcrumb
          items={crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            if (isLast) {
              return {
                title: (
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.text.high }}
                    aria-current="page"
                  >
                    {crumb.title}
                  </span>
                ),
              };
            }
            return {
              title: (
                <a
                  href={crumb.href}
                  className="text-sm hover:underline transition-colors"
                  style={{ color: colors.text.medium }}
                >
                  {crumb.title}
                </a>
              ),
            };
          })}
        />

        {/* Right side actions */}
        <Space size="middle" className="flex items-center">
          {/* Search trigger */}
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: colors.text.low }} />}
            placeholder="Search (⌘K)"
            style={{
              width: 220,
              background: colors.bg.elevated1,
              borderColor: colors.border.subtle,
            }}
            onFocus={() => {
              try {
                const ev = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                });
                window.dispatchEvent(ev);
              } catch {}
            }}
            onClick={(e) => {
              (e.target as HTMLInputElement).blur();
              try {
                const ev = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                });
                window.dispatchEvent(ev);
              } catch {}
            }}
            readOnly
          />

          {/* Quick actions */}
          <div className="hidden md:flex items-center gap-1">
            {quickActions.map((action) => (
              <Tooltip
                key={action.key}
                title={`${action.label} (${action.shortcut})`}
              >
                <Button
                  type="text"
                  icon={action.icon}
                  onClick={action.onClick}
                  style={{ color: colors.text.medium }}
                />
              </Tooltip>
            ))}
          </div>

          {/* Divider */}
          <div
            className="hidden md:block h-6 w-px"
            style={{ background: colors.border.DEFAULT }}
          />

          {/* Assistant */}
          <Tooltip title="Open Copilot (⌘⇧C)">
            <Button
              type="text"
              icon={<RobotOutlined />}
              onClick={() => onOpenAssistant?.()}
              style={{ color: colors.accent.DEFAULT }}
            />
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <Badge
              count={notificationCount}
              size="small"
              offset={[-4, 4]}
              style={{ background: colors.danger.text }}
            >
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => onOpenNotifications?.()}
                style={{ color: colors.text.medium }}
              />
            </Badge>
          </Tooltip>

          {/* User menu */}
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{
                background: `linear-gradient(135deg, ${colors.primary.DEFAULT} 0%, ${colors.primary.active} 100%)`,
                cursor: "pointer",
              }}
            />
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
}
