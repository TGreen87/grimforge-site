"use client";

import React from "react";
import { List, useTable, TextField, BooleanField } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  published: boolean;
  updated_at: string;
}

export default function ArticlesList() {
  const { tableProps, tableQueryResult } = useTable<ArticleRow>({
    resource: "articles",
    meta: { select: "*" },
  });
  const [size, setSize] = React.useState<TableSize>("small")

  return (
    <List title="Articles" headerButtons={<AdminTableToolbar title="Articles" size={size} onSizeChange={setSize} onRefresh={() => tableQueryResult.refetch()} searchPlaceholder="Search articles" />}>
      <Table {...tableProps} rowKey="id" size={size} sticky rowClassName={(_, index) => (index % 2 === 1 ? 'admin-row-zebra' : '')}>
        <Table.Column dataIndex="title" title="Title" render={(v: string) => <TextField value={v} />} />
        <Table.Column dataIndex="slug" title="Slug" render={(v: string) => <TextField value={v} />} />
        <Table.Column dataIndex="author" title="Author" render={(v?: string) => <TextField value={v || '—'} />} />
        <Table.Column dataIndex="published" title="Published" render={(v: boolean) => <BooleanField value={v} />} />
        <Table.Column dataIndex="updated_at" title="Updated" render={(v: string) => <Tag>{new Date(v).toLocaleString()}</Tag>} />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: ArticleRow) => (
            <Space>
              <Link href={`/admin/articles/show/${record.id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
              <Link href={`/admin/articles/edit/${record.id}`}>
                <Button size="small" icon={<EditOutlined />} />
              </Link>
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
