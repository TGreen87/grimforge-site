"use client";

import React from "react";
import { Show, TextField, BooleanField, NumberField, DateField, TagField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Space, Tag } from "antd";
import type { Product } from "../../../types";

const { Title, Text } = Typography;

export default function ProductShow() {
  const { queryResult } = useShow<Product>({
    resource: "products",
  });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      {record && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={5}>Title</Title>
            <TextField value={record.title} />
          </div>

          <div>
            <Title level={5}>Artist</Title>
            <TextField value={record.artist} />
          </div>

          <div>
            <Title level={5}>Description</Title>
            <Text>{record.description || "No description"}</Text>
          </div>

          <div>
            <Title level={5}>Format</Title>
            <TagField value={record.format} />
          </div>

          <div>
            <Title level={5}>Price</Title>
            <NumberField value={record.price} options={{ style: "currency", currency: "AUD" }} />
          </div>

          <div>
            <Title level={5}>Stock</Title>
            <Tag color={record.stock > 0 ? "green" : "red"}>{record.stock}</Tag>
          </div>

          <div>
            <Title level={5}>SKU</Title>
            <Text>{record.sku || "N/A"}</Text>
          </div>

          <div>
            <Title level={5}>Release Year</Title>
            <Text>{record.release_year || "N/A"}</Text>
          </div>

          <div>
            <Title level={5}>Tags</Title>
            <Space>
              {record.tags?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              )) || "No tags"}
            </Space>
          </div>

          <div>
            <Title level={5}>Status</Title>
            <Space>
              <Tag color={record.active ? "green" : "red"}>
                {record.active ? "Active" : "Inactive"}
              </Tag>
              {record.featured && <Tag color="gold">Featured</Tag>}
              {record.limited && <Tag color="purple">Limited Edition</Tag>}
              {record.pre_order && <Tag color="blue">Pre-Order</Tag>}
            </Space>
          </div>

          <div>
            <Title level={5}>Created At</Title>
            <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" />
          </div>

          <div>
            <Title level={5}>Updated At</Title>
            <DateField value={record.updated_at} format="YYYY-MM-DD HH:mm:ss" />
          </div>
        </Space>
      )}
    </Show>
  );
}