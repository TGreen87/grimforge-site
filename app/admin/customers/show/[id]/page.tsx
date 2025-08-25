"use client";

import React from "react";
import { Show, TextField, DateField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Space, Descriptions, Card, Table, Tag } from "antd";
import type { Customer, Order, Address } from "../../../types";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  pending: "orange",
  paid: "green",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
};

export default function CustomerShow() {
  const { queryResult } = useShow<Customer>({
    resource: "customers",
    meta: {
      select: "*, orders(*), addresses(*)",
    },
  });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      {record && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card title="Customer Information">
            <Descriptions column={2}>
              <Descriptions.Item label="Email">
                <TextField value={record.email} />
              </Descriptions.Item>
              <Descriptions.Item label="First Name">
                <TextField value={record.first_name || "N/A"} />
              </Descriptions.Item>
              <Descriptions.Item label="Last Name">
                <TextField value={record.last_name || "N/A"} />
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <TextField value={record.phone || "N/A"} />
              </Descriptions.Item>
              <Descriptions.Item label="Stripe Customer ID">
                <Text copyable={!!record.stripe_customer_id}>
                  {record.stripe_customer_id || "N/A"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Joined">
                <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" />
              </Descriptions.Item>
              {record.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  <Text>{record.notes}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {record.addresses && record.addresses.length > 0 && (
            <Card title="Addresses">
              <Table
                dataSource={record.addresses}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: "Type",
                    dataIndex: "type",
                    key: "type",
                    render: (type: string) => (
                      <Tag color={type === "billing" ? "blue" : "green"}>
                        {type.toUpperCase()}
                      </Tag>
                    ),
                  },
                  {
                    title: "Address",
                    key: "address",
                    render: (_, address: Address) => (
                      <Space direction="vertical" size={0}>
                        <Text>{address.line1}</Text>
                        {address.line2 && <Text>{address.line2}</Text>}
                        <Text>
                          {address.city}, {address.state} {address.postal_code}
                        </Text>
                        <Text>{address.country}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: "Default",
                    dataIndex: "is_default",
                    key: "is_default",
                    render: (isDefault: boolean) => (
                      isDefault ? <Tag color="gold">Default</Tag> : null
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {record.orders && record.orders.length > 0 && (
            <Card title="Order History">
              <Table
                dataSource={record.orders}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: "Order ID",
                    dataIndex: "id",
                    key: "id",
                    render: (id: string) => (
                      <Text copyable>{id.substring(0, 8)}...</Text>
                    ),
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    render: (status: string) => (
                      <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
                    ),
                  },
                  {
                    title: "Total",
                    dataIndex: "total",
                    key: "total",
                    render: (total: number) => `$${total.toFixed(2)} AUD`,
                  },
                  {
                    title: "Date",
                    dataIndex: "created_at",
                    key: "created_at",
                    render: (date: string) => (
                      <DateField value={date} format="YYYY-MM-DD" />
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </Space>
      )}
    </Show>
  );
}