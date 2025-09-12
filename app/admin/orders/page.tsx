"use client";

import React from "react";
import { List, useTable, TextField, NumberField, DateField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Select } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import { EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useUpdate } from "@refinedev/core";
import { message } from "antd";
import type { Order, OrderItem } from "../types";

const statusColors: Record<string, string> = {
  pending: "orange",
  paid: "green",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
};

export default function OrderList() {
  const { tableProps, tableQueryResult } = useTable<Order>({
    resource: "orders",
    meta: {
      select: "*, customer:customers(*), order_items(*, variant:variants(*))",
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

  const { mutate: updateOrder } = useUpdate();

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrder(
      {
        resource: "orders",
        id: orderId,
        values: {
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          message.success("Order status updated successfully");
          tableQueryResult.refetch();
        },
        onError: (error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          message.error(`Failed to update order status: ${errorMessage}`);
        },
      }
    );
  };

  const [size, setSize] = React.useState<TableSize>("small")
  return (
    <List headerButtons={<AdminTableToolbar title="Orders" size={size} onSizeChange={setSize} onRefresh={() => tableQueryResult.refetch()} searchPlaceholder="Search orders" />}>
      <Table {...tableProps} rowKey="id" size={size} sticky rowClassName={(_, index) => (index % 2 === 1 ? 'admin-row-zebra' : '')}>
        <Table.Column
          dataIndex="id"
          title="Order ID"
          render={(value: string) => <TextField value={value?.substring(0, 8) + "..."} />}
        />
        <Table.Column
          dataIndex={["customer", "email"]}
          title="Customer"
          render={(value: string | null) => <TextField value={value || "Guest"} />}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value: string, record: Order) => (
            <Select
              value={value}
              onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
              style={{ width: 120 }}
            >
              <Select.Option value="pending">
                <Tag color={statusColors.pending}>Pending</Tag>
              </Select.Option>
              <Select.Option value="paid">
                <Tag color={statusColors.paid}>Paid</Tag>
              </Select.Option>
              <Select.Option value="processing">
                <Tag color={statusColors.processing}>Processing</Tag>
              </Select.Option>
              <Select.Option value="shipped">
                <Tag color={statusColors.shipped}>Shipped</Tag>
              </Select.Option>
              <Select.Option value="delivered">
                <Tag color={statusColors.delivered}>Delivered</Tag>
              </Select.Option>
              <Select.Option value="cancelled">
                <Tag color={statusColors.cancelled}>Cancelled</Tag>
              </Select.Option>
              <Select.Option value="refunded">
                <Tag color={statusColors.refunded}>Refunded</Tag>
              </Select.Option>
            </Select>
          )}
        />
        <Table.Column
          dataIndex="total"
          title="Total"
          render={(value: number) => (
            <NumberField value={value} options={{ style: "currency", currency: "AUD" }} />
          )}
          sorter
        />
        <Table.Column
          dataIndex="order_items"
          title="Items"
          render={(items: OrderItem[] | null) => <Tag>{items?.length || 0} items</Tag>}
        />
        <Table.Column
          dataIndex="created_at"
          title="Date"
          render={(value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm" />}
          sorter
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: Order) => (
            <Space>
              <Link href={`/admin/orders/show/${record.id}`}>
                <Button size="small" icon={<EyeOutlined />}>
                  View
                </Button>
              </Link>
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
