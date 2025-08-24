"use client";

import React from "react";
import { List, useTable, DateField, BooleanField, NumberField, TextField, TagField } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { Product } from "../types";

export default function ProductList() {
  const { tableProps } = useTable<Product>({
    resource: "products",
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="title"
          title="Title"
          render={(value: string) => <TextField value={value} />}
          sorter
        />
        <Table.Column
          dataIndex="artist"
          title="Artist"
          render={(value: string) => <TextField value={value} />}
          sorter
        />
        <Table.Column
          dataIndex="format"
          title="Format"
          render={(value: string) => <TagField value={value} />}
        />
        <Table.Column
          dataIndex="price"
          title="Price"
          render={(value: number) => <NumberField value={value} options={{ style: "currency", currency: "AUD" }} />}
          sorter
        />
        <Table.Column
          dataIndex="stock"
          title="Stock"
          render={(value: number) => (
            <Tag color={value > 0 ? "green" : "red"}>
              {value}
            </Tag>
          )}
          sorter
        />
        <Table.Column
          dataIndex="active"
          title="Active"
          render={(value: boolean) => <BooleanField value={value} />}
        />
        <Table.Column
          dataIndex="featured"
          title="Featured"
          render={(value: boolean) => <BooleanField value={value} />}
        />
        <Table.Column
          dataIndex="created_at"
          title="Created"
          render={(value: string) => <DateField value={value} format="YYYY-MM-DD" />}
          sorter
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: Product) => (
            <Space>
              <Link href={`/admin/products/show/${record.id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
              <Link href={`/admin/products/edit/${record.id}`}>
                <Button size="small" icon={<EditOutlined />} />
              </Link>
            </Space>
          )}
        />
      </Table>
    </List>
  );
}