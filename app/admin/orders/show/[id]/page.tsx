"use client";

import React from "react";
import { Show, TextField, NumberField, DateField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Space, Tag, Table, Card, Descriptions } from "antd";
import type { Order, OrderItem } from "../../../types";

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

export default function OrderShow() {
  const { queryResult } = useShow<Order>({
    resource: "orders",
    meta: {
      select: "*, customer:customers(*), order_items(*, variant:variants(*, product:products(*)))",
    },
  });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      {record && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card title="Order Information">
            <Descriptions column={2}>
              <Descriptions.Item label="Order ID">
                <TextField value={record.id} />
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[record.status]}>{record.status.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" />
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                <DateField value={record.updated_at} format="YYYY-MM-DD HH:mm:ss" />
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <NumberField value={record.total} options={{ style: "currency", currency: "AUD" }} />
              </Descriptions.Item>
              <Descriptions.Item label="Currency">
                <TextField value={record.currency} />
              </Descriptions.Item>
              {record.stripe_session_id && (
                <Descriptions.Item label="Stripe Session">
                  <Text copyable>{record.stripe_session_id}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Customer Information">
            <Descriptions column={2}>
              <Descriptions.Item label="Email">
                <TextField value={record.customer?.email || "Guest Checkout"} />
              </Descriptions.Item>
              <Descriptions.Item label="Name">
                <TextField
                  value={
                    record.customer
                      ? `${record.customer.first_name || ""} ${record.customer.last_name || ""}`
                      : "N/A"
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <TextField value={record.customer?.phone || "N/A"} />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {record.shipping_address && (
            <Card title="Shipping Address">
              <Descriptions column={1}>
                <Descriptions.Item label="Address">
                  <Text>
                    {record.shipping_address.line1}
                    {record.shipping_address.line2 && <br />}
                    {record.shipping_address.line2}
                    <br />
                    {record.shipping_address.city}, {record.shipping_address.state}{" "}
                    {record.shipping_address.postal_code}
                    <br />
                    {record.shipping_address.country}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Card title="Order Items">
            <Table
              dataSource={record.order_items}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: "Product",
                  dataIndex: ["variant", "product", "title"],
                  key: "product",
                },
                {
                title: "Stock Unit",
                  dataIndex: ["variant", "name"],
                  key: "variant",
                },
                {
                  title: "SKU",
                  dataIndex: ["variant", "sku"],
                  key: "sku",
                },
                {
                  title: "Quantity",
                  dataIndex: "quantity",
                  key: "quantity",
                },
                {
                  title: "Unit Price",
                  dataIndex: "price",
                  key: "price",
                  render: (value: number) => (
                    <NumberField value={value} options={{ style: "currency", currency: "AUD" }} />
                  ),
                },
                {
                  title: "Total",
                  dataIndex: "total",
                  key: "total",
                  render: (value: number) => (
                    <NumberField value={value} options={{ style: "currency", currency: "AUD" }} />
                  ),
                },
              ]}
            />
          </Card>

          {record.notes && (
            <Card title="Order Notes">
              <Text>{record.notes}</Text>
            </Card>
          )}
        </Space>
      )}
    </Show>
  );
}
