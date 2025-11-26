"use client";

import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { App as AntdAppWrapper, ConfigProvider, theme as antdTheme } from "antd";
import { usePathname } from "next/navigation";
import AdminLayout from "../ui/AdminLayout";
import AdminKbarActions from "../ui/AdminKbarActions";
import {
  ShoppingCartOutlined,
  AppstoreOutlined,
  InboxOutlined,
  TeamOutlined,
  FileTextOutlined,
  TagsOutlined,
  DashboardOutlined,
  NotificationOutlined,
  SettingOutlined,
  BookOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  ApiOutlined
} from "@ant-design/icons";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./auth-provider";
import { dataProvider } from "./data-provider";
import { antdThemeConfig, globalAdminStyles } from "../theme";

const resources = [
  {
    name: "dashboard",
    list: "/admin/dashboard",
    meta: {
      label: "Dashboard",
      icon: <DashboardOutlined />,
    },
  },
  {
    name: "campaigns",
    list: "/admin/campaigns",
    create: "/admin/campaigns/create",
    edit: "/admin/campaigns/edit/:id",
    meta: {
      label: "Campaigns",
      icon: <NotificationOutlined />,
    },
  },
  {
    name: "campaign_revisions",
    list: "/admin/campaigns",
    meta: {
      label: "Campaign Revisions",
      canDelete: false,
      parent: "campaigns",
      hide: true,
    },
  },
  {
    name: "story",
    list: "/admin/story",
    meta: {
      label: "Story Content",
      icon: <BookOutlined />,
    },
  },
  {
    name: "settings",
    list: "/admin/settings",
    meta: {
      label: "Settings",
      icon: <SettingOutlined />,
    },
  },
  {
    name: "analytics",
    list: "/admin/analytics",
    meta: {
      label: "Analytics",
      icon: <LineChartOutlined />,
    },
  },
  {
    name: "assistant_sessions",
    list: "/admin/assistant/logs",
    meta: {
      label: "Assistant Logs",
      icon: <ThunderboltOutlined />,
    },
  },
  {
    name: "products",
    list: "/admin/products",
    create: "/admin/products/create",
    edit: "/admin/products/edit/:id",
    show: "/admin/products/show/:id",
    meta: {
      label: "Products",
      icon: <AppstoreOutlined />,
    },
  },
  {
    name: "variants",
    list: "/admin/variants",
    create: "/admin/variants/create",
    edit: "/admin/variants/edit/:id",
    show: "/admin/variants/show/:id",
    meta: {
      label: "Stock Units",
      icon: <TagsOutlined />,
    },
  },
  {
    name: "articles",
    list: "/admin/articles",
    create: "/admin/articles/create",
    edit: "/admin/articles/edit/:id",
    show: "/admin/articles/show/:id",
    meta: {
      label: "Articles",
      icon: <FileTextOutlined />,
    },
  },
  {
    name: "inventory",
    list: "/admin/inventory",
    edit: "/admin/inventory/edit/:id",
    meta: {
      label: "Inventory",
      icon: <InboxOutlined />,
    },
  },
  {
    name: "orders",
    list: "/admin/orders",
    show: "/admin/orders/show/:id",
    meta: {
      label: "Orders",
      icon: <ShoppingCartOutlined />,
    },
  },
  {
    name: "customers",
    list: "/admin/customers",
    create: "/admin/customers/create",
    edit: "/admin/customers/edit/:id",
    show: "/admin/customers/show/:id",
    meta: {
      label: "Customers",
      icon: <TeamOutlined />,
    },
  },
  {
    name: "audit_logs",
    list: "/admin/audit-logs",
    meta: {
      label: "Audit Logs",
      icon: <FileTextOutlined />,
    },
  },
];

export function RefineProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname?.startsWith("/admin/login");

  return (
    <RefineKbarProvider>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.darkAlgorithm,
          ...antdThemeConfig,
        }}
        componentSize="small"
      >
        <AntdAppWrapper>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider()}
            authProvider={authProvider}
            resources={resources}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              projectId: "grimforge-admin",
            }}
          >
            <div className="admin-root">
              <style jsx global>{globalAdminStyles}</style>
              <AdminLayout>
                <AdminKbarActions />
                {isLoginRoute ? (
                  children
                ) : (
                  <Authenticated
                    key="authenticated-routes"
                    fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                          <div className="admin-skeleton w-16 h-16 rounded-full mx-auto mb-4" />
                          <p className="text-sm text-[var(--admin-text-medium)]">Loading admin panel...</p>
                        </div>
                      </div>
                    }
                    loading={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                          <div className="admin-skeleton w-16 h-16 rounded-full mx-auto mb-4" />
                          <p className="text-sm text-[var(--admin-text-medium)]">Authenticating...</p>
                        </div>
                      </div>
                    }
                  >
                    {children}
                  </Authenticated>
                )}
              </AdminLayout>
            </div>
            <RefineKbar />
          </Refine>
        </AntdAppWrapper>
      </ConfigProvider>
    </RefineKbarProvider>
  );
}
