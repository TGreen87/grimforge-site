"use client";

import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { ThemedLayoutV2, ThemedSiderV2, ThemedTitleV2 } from "@refinedev/antd";
import { App as AntdAppWrapper, ConfigProvider } from "antd";
import { brand } from "@/config/brand";
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
      label: "Variants",
      icon: <TagsOutlined />,
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
  return (
    <RefineKbarProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#8B0000",
            borderRadius: 4,
          },
        }}
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
            <ThemedLayoutV2
              Sider={() => (
                <ThemedSiderV2 
                  Title={() => (
                    <ThemedTitleV2 
                      collapsed={false} 
                      text={`${brand.shortName} Admin`} 
                      icon={<DashboardOutlined />}
                    />
                  )}
                />
              )}
            >
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
            </ThemedLayoutV2>
            <RefineKbar />
          </Refine>
        </AntdAppWrapper>
      </ConfigProvider>
    </RefineKbarProvider>
  );
}
