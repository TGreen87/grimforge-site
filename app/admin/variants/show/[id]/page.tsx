"use client";

import React from "react";
import { Show, TextField, NumberField, DateField, BooleanField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Space, Tag, Descriptions } from "antd";
import type { Variant } from "../../../types";

const { Title } = Typography;

export default function VariantShow() {
  const { queryResult } = useShow<Variant>({
    resource: "variants",
    meta: {
      select: "*, product:products(*), inventory(*)",
    },
  });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      {record && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Descriptions title="Variant Information" bordered column={2}>
            <Descriptions.Item label="Name">
              <TextField value={record.name} />
            </Descriptions.Item>
            <Descriptions.Item label="SKU">
              <TextField value={record.sku} />
            </Descriptions.Item>
            <Descriptions.Item label="Product">
              <TextField value={record.product?.title} />
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              <NumberField value={record.price} options={{ style: "currency", currency: "AUD" }} />
            </Descriptions.Item>
            <Descriptions.Item label="Size">
              <TextField value={record.size || "N/A"} />
            </Descriptions.Item>
            <Descriptions.Item label="Color">
              <TextField value={record.color || "N/A"} />
            </Descriptions.Item>
            <Descriptions.Item label="Weight">
              {record.weight ? `${record.weight}g` : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Dimensions">
              <TextField value={record.dimensions || "N/A"} />
            </Descriptions.Item>
            <Descriptions.Item label="Barcode">
              <TextField value={record.barcode || "N/A"} />
            </Descriptions.Item>
            <Descriptions.Item label="Active">
              <BooleanField value={record.active} />
            </Descriptions.Item>
          </Descriptions>

          {record.inventory && (
            <Descriptions title="Inventory Information" bordered column={2}>
              <Descriptions.Item label="On Hand">
                <Tag color={record.inventory.on_hand > 0 ? "green" : "red"}>
                  {record.inventory.on_hand}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Allocated">
                <Tag>{record.inventory.allocated}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Available">
                <Tag color={record.inventory.available > 0 ? "green" : "orange"}>
                  {record.inventory.available}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reorder Point">
                <Tag color="blue">{record.inventory.reorder_point || "N/A"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reorder Quantity">
                {record.inventory.reorder_quantity || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                <DateField value={record.inventory.updated_at} format="YYYY-MM-DD HH:mm:ss" />
              </Descriptions.Item>
            </Descriptions>
          )}

          <Descriptions title="System Information" bordered column={2}>
            <Descriptions.Item label="Created At">
              <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" />
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              <DateField value={record.updated_at} format="YYYY-MM-DD HH:mm:ss" />
            </Descriptions.Item>
          </Descriptions>
        </Space>
      )}
    </Show>
  );
}