"use client";

import React from "react";
import { List, useTable, TextField, DateField } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import AdminViewToggle, { AdminView, getStoredView } from "../ui/AdminViewToggle";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { Customer, Order, Address } from "../types";

export default function CustomerList() {
  const { tableProps, tableQueryResult } = useTable<Customer>({
    resource: "customers",
    meta: {
      select: "*, orders(id), addresses(id)",
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  const [size, setSize] = React.useState<TableSize>("small")
  const [view, setView] = React.useState<AdminView>(typeof window === 'undefined' ? 'table' : getStoredView('customers'))
  return (
    <List headerButtons={<AdminTableToolbar title="Customers" size={size} onSizeChange={setSize} onRefresh={() => tableQueryResult.refetch()} searchPlaceholder="Search customers" rightSlot={<AdminViewToggle resource='customers' value={view} onChange={setView} />} />}>
      {view === 'table' ? (
      <Table {...tableProps} rowKey="id" size={size} sticky rowClassName={(_, index) => (index % 2 === 1 ? 'admin-row-zebra' : '')}>
        <Table.Column
          dataIndex="email"
          title="Email"
          render={(value: string) => <TextField value={value} />}
          sorter
        />
        <Table.Column
          dataIndex="first_name"
          title="First Name"
          render={(value: string | null) => <TextField value={value || "N/A"} />}
          sorter
        />
        <Table.Column
          dataIndex="last_name"
          title="Last Name"
          render={(value: string | null) => <TextField value={value || "N/A"} />}
          sorter
        />
        <Table.Column
          dataIndex="phone"
          title="Phone"
          render={(value: string | null) => <TextField value={value || "N/A"} />}
        />
        <Table.Column
          dataIndex="orders"
          title="Orders"
          render={(orders: Order[] | null) => <Tag>{orders?.length || 0} orders</Tag>}
        />
        <Table.Column
          dataIndex="addresses"
          title="Addresses"
          render={(addresses: Address[] | null) => <Tag>{addresses?.length || 0} addresses</Tag>}
        />
        <Table.Column
          dataIndex="created_at"
          title="Joined"
          render={(value: string) => <DateField value={value} format="YYYY-MM-DD" />}
          sorter
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: Customer) => (
            <Space>
              <Link href={`/admin/customers/show/${record.id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
              <Link href={`/admin/customers/edit/${record.id}`}>
                <Button size="small" icon={<EditOutlined />} />
              </Link>
            </Space>
          )}
        />
      </Table>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(tableProps.dataSource as Customer[] | undefined)?.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-4 bg-[#0b0b0b]">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-bone font-semibold truncate">{c.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.first_name || '—'} {c.last_name || ''}</div>
                </div>
                <div className="text-xs text-muted-foreground">Joined {new Date(c.created_at as any).toLocaleDateString()}</div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300">Orders: {(c as any).orders?.length || 0}</span>
                <span className="px-2 py-0.5 rounded bg-gray-600/20 text-gray-300">Addresses: {(c as any).addresses?.length || 0}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <a href={`/admin/customers/show/${c.id}`} className="inline-block"><button className="px-3 py-1 text-xs border border-border rounded">View</button></a>
                <a href={`/admin/customers/edit/${c.id}`} className="inline-block"><button className="px-3 py-1 text-xs border border-border rounded">Edit</button></a>
              </div>
            </div>
          ))}
        </div>
      )}
    </List>
  );
}
