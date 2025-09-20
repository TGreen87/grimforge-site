"use client";
import React from "react";
import { Layout, Breadcrumb, Input, Space, Dropdown, Avatar, Button, Tooltip } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { SearchOutlined, UserOutlined, PlusOutlined, InboxOutlined, FileTextOutlined } from "@ant-design/icons";

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
  const router = useRouter();
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === '1') router.push('/admin/products');
      if (e.key === '2') router.push('/admin/inventory');
      if (e.key === '3') router.push('/admin/orders');
      if (e.key === '4') router.push('/admin/customers');
      if (e.key === '5') router.push('/admin/articles');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);
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
          items={crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            const commonClass = "inline-flex min-h-[32px] items-center rounded px-3 py-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            if (isLast) {
              return {
                title: (
                  <span
                    className={`${commonClass} text-bone cursor-default`}
                    aria-current="page"
                  >
                    {crumb.title}
                  </span>
                ),
              }
            }
            return {
              title: (
                <a
                  href={crumb.href}
                  className={`${commonClass} text-muted-foreground hover:text-accent`}
                >
                  {crumb.title}
                </a>
              ),
            }
          })}
        />
        <Space size="middle">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search (K)"
            style={{ width: 300 }}
            onFocus={() => {
              try {
                const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(ev);
              } catch {}
            }}
            onClick={(e) => {
              (e.target as HTMLInputElement).blur();
              try {
                const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(ev);
              } catch {}
            }}
            readOnly
          />
          <Dropdown menu={menu} trigger={["click"]}>
            <Avatar style={{ backgroundColor: "#8B0000" }} icon={<UserOutlined />} />
          </Dropdown>
          <Space size="small">
            <Tooltip title="New Product (n p)"><Button icon={<PlusOutlined />} onClick={()=>router.push('/admin/products/create')} /></Tooltip>
            <Tooltip title="Receive Stock (r s)"><Button icon={<InboxOutlined />} onClick={()=>router.push('/admin/inventory')} /></Tooltip>
            <Tooltip title="New Article (n a)"><Button icon={<FileTextOutlined />} onClick={()=>router.push('/admin/articles/create')} /></Tooltip>
          </Space>
        </Space>
      </div>
    </Header>
  );
}
