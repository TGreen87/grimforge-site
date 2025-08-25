"use client";

import React from "react";
import { List, useTable, TextField, NumberField, BooleanField } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { Variant } from "../types";

export default function VariantList() {
  const { tableProps } = useTable<Variant>({
    resource: "variants",
    meta: {
      select: "*, product:products(*), inventory(*)",
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="name"
          title="Name"
          render={(value: string) => <TextField value={value} />}
        />
        <Table.Column
          dataIndex={["product", "title"]}
          title="Product"
          render={(value: string) => <TextField value={value} />}
        />
        <Table.Column
          dataIndex="sku"
          title="SKU"
          render={(value: string) => <TextField value={value} />}
        />
        <Table.Column
          dataIndex="price"
          title="Price"
          render={(value: number) => <NumberField value={value} options={{ style: "currency", currency: "AUD" }} />}
        />
        <Table.Column
          dataIndex={["inventory", "on_hand"]}
          title="On Hand"
          render={(value: number | null) => (
            <Tag color={value && value > 0 ? "green" : "red"}>
              {value || 0}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex={["inventory", "allocated"]}
          title="Allocated"
          render={(value: number | null) => <Tag>{value || 0}</Tag>}
        />
        <Table.Column
          dataIndex={["inventory", "available"]}
          title="Available"
          render={(value: number | null) => (
            <Tag color={value && value > 0 ? "green" : "red"}>
              {value || 0}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="active"
          title="Active"
          render={(value: boolean) => <BooleanField value={value} />}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: Variant) => (
            <Space>
              <Link href={`/admin/variants/show/${record.id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
              <Link href={`/admin/variants/edit/${record.id}`}>
                <Button size="small" icon={<EditOutlined />} />
              </Link>
            </Space>
          )}
        />
      </Table>
    </List>
  );
}