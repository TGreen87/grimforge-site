"use client";

import React from "react";
import { List, useTable, TextField, DateField } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
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
  return (
    <List headerButtons={<AdminTableToolbar title="Customers" size={size} onSizeChange={setSize} onRefresh={() => tableQueryResult.refetch()} searchPlaceholder="Search customers" />}>
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
    </List>
  );
}
