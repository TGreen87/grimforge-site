"use client";

import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { App as AntdAppWrapper, ConfigProvider, theme as antdTheme } from "antd";
import { brand } from "@/config/brand";
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
  LineChartOutlined
} from "@ant-design/icons";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./auth-provider";
import { dataProvider } from "./data-provider";

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
            colorPrimary: 'var(--clr-primary)',
            colorInfo: 'var(--clr-primary)',
            colorSuccess: 'var(--clr-success-text)',
            colorWarning: 'var(--clr-warn-text)',
            colorError: 'var(--clr-danger-text)',
            colorLink: 'var(--clr-primary)',
            colorBgBase: 'var(--clr-bg-base)',
            colorBgContainer: 'var(--clr-bg-elev0)',
            colorText: 'var(--clr-text-high)',
            colorTextSecondary: 'var(--clr-text-med)',
            colorBorder: 'var(--clr-border)',
            borderRadius: 8,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
          },
          components: {
            Layout: {
              bodyBg: 'var(--clr-bg-base)',
              headerBg: 'var(--clr-bg-elev0)',
              siderBg: 'var(--clr-bg-elev0)',
            },
            Menu: {
              darkItemBg: 'var(--clr-bg-elev0)',
              itemSelectedBg: 'var(--clr-bg-elev1)',
              itemSelectedColor: 'var(--clr-text-high)',
            },
            Table: {
              headerBg: 'var(--clr-bg-elev1)',
              headerColor: 'var(--clr-text-high)',
              rowHoverBg: 'var(--clr-bg-elev1)',
            },
            Button: {
              colorPrimaryHover: 'var(--clr-primary-hover)',
              colorPrimaryActive: 'var(--clr-primary-active)',
            },
            Input: {
              activeBorderColor: 'var(--clr-focus)'
            },
            Segmented: {
              itemSelectedBg: 'var(--clr-bg-elev1)'
            },
            Tag: {
              defaultBg: 'var(--clr-bg-elev1)',
              defaultColor: 'var(--clr-text-med)'
            }
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
              <AdminKbarActions />
              {/* Global styles for tokens, focus, and zebra */}
              <style jsx global>{`
                :root {
                  --clr-bg-base:#0B0F14; --clr-bg-elev0:#0E131A; --clr-bg-elev1:#121924; --clr-bg-elev2:#182333;
                  --clr-text-high:#E6EDF3; --clr-text-med:#A7B1BD; --clr-text-low:#7A8694;
                  --clr-primary:#2DD4BF; --clr-primary-hover:#26BFAE; --clr-primary-active:#1CA394;
                  --clr-border:#1E2A3A; --clr-focus:#7DD3FC;
                  --clr-success-bg:#0E2B22; --clr-success-text:#86EFAC;
                  --clr-warn-bg:#2B220E; --clr-warn-text:#FACC15;
                  --clr-danger-bg:#2B1414; --clr-danger-text:#F87171;
                  --clr-info-bg:#102336; --clr-info-text:#93C5FD;
                  --rad-xs:6px; --rad-sm:8px; --rad-md:12px; --rad-lg:16px; --rad-xl:20px;
                  --sh-sm:0 1px 0 rgba(255,255,255,0.03), 0 1px 8px rgba(0,0,0,0.35);
                  --sh-md:0 2px 16px rgba(0,0,0,0.45); --sh-lg:0 8px 32px rgba(0,0,0,0.5);
                  --dur-90:90ms; --dur-140:140ms; --dur-190:190ms; --dur-240:240ms;
                  --ease-enter:cubic-bezier(.2,.8,.2,1); --ease-leave:cubic-bezier(.4,0,.2,1);
                }
                a:focus-visible, button:focus-visible, [role="button"]:focus-visible, .ant-segmented:focus-visible, .ant-input:focus-visible {
                  outline: 2px solid var(--clr-focus);
                  outline-offset: 2px;
                  border-color: var(--clr-focus) !important;
                }
                .ant-table-thead > tr > th { height: 40px; font-size: 14px; }
                .ant-table-tbody > tr.admin-row-zebra > td { background-color: #0d0f12 !important; }
                .kanban-card { transition: transform var(--dur-140) var(--ease-enter), box-shadow var(--dur-140) var(--ease-enter), background-color var(--dur-140) var(--ease-enter); }
                .kanban-card:hover { transform: translateY(-2px); box-shadow: var(--sh-sm); }
                .ant-menu-dark .ant-menu-item-selected { border-left: 2px solid var(--clr-primary); padding-left: 14px !important; }
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
