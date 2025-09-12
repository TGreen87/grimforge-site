"use client";

import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { App as AntdAppWrapper, ConfigProvider, theme as antdTheme } from "antd";
import { brand } from "@/config/brand";
import { usePathname } from "next/navigation";
import AdminLayout from "../ui/AdminLayout";
import { 
  ShoppingCartOutlined, 
  AppstoreOutlined, 
  InboxOutlined, 
  TeamOutlined, 
  FileTextOutlined,
  TagsOutlined,
  DashboardOutlined
} from "@ant-design/icons";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./auth-provider";
import { dataProvider } from "./data-provider";

const resources = [
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
          token: {
            colorPrimary: "#8B0000", // blood-accent
            colorBgBase: "#0a0a0a",
            colorText: "#e5e7eb",
            colorBorder: "#1f2937",
            borderRadius: 4,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
          },
          components: {
            Layout: {
              bodyBg: "#0a0a0a",
              headerBg: "#0f0f0f",
              siderBg: "#0f0f0f",
            },
            Menu: {
              darkItemBg: "#0f0f0f",
              itemSelectedBg: "#1f2937",
              itemSelectedColor: "#ffffff",
            },
            Table: {
              headerBg: "#111827",
              headerColor: "#e5e7eb",
              rowHoverBg: "#111827",
            },
            Button: {
              colorPrimaryHover: "#a30000",
              colorPrimaryActive: "#7a0000",
            },
          },
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
            <AdminLayout>
              {/* Global styles for admin table zebra rows */}
              <style jsx global>{`
                .ant-table-tbody > tr.admin-row-zebra > td {
                  background-color: #0d0f12 !important;
                }
              `}</style>
              {isLoginRoute ? (
                children
              ) : (
                <Authenticated
                  key="authenticated-routes"
                  fallback={<div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
                      <p className="text-lg">Loading admin panel...</p>
                    </div>
                  </div>}
                  loading={<div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
                      <p className="text-lg">Authenticating...</p>
                    </div>
                  </div>}
                >
                  {children}
                </Authenticated>
              )}
            </AdminLayout>
            <RefineKbar />
          </Refine>
        </AntdAppWrapper>
      </ConfigProvider>
    </RefineKbarProvider>
  );
}
