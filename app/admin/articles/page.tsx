"use client";

import React from "react";
import { List, useTable, TextField, BooleanField } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import AdminViewToggle, { AdminView, getStoredView } from "../ui/AdminViewToggle";
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
  const [view, setView] = React.useState<AdminView>(typeof window === 'undefined' ? 'table' : getStoredView('articles'))

  return (
    <List title="Articles" headerButtons={<AdminTableToolbar title="Articles" size={size} onSizeChange={setSize} onRefresh={() => tableQueryResult.refetch()} searchPlaceholder="Search articles" rightSlot={<AdminViewToggle resource='articles' value={view} onChange={setView} />} />}>
      {view === 'table' ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(tableProps.dataSource as ArticleRow[] | undefined)?.map((a) => (
            <div key={a.id} className="border border-border rounded-lg p-4 bg-[#0b0b0b]">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-bone font-semibold truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground truncate">/{a.slug}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${a.published ? 'bg-green-600/20 text-green-300' : 'bg-gray-600/20 text-gray-300'}`}>{a.published ? 'Published' : 'Draft'}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Updated {new Date((a as any).updated_at).toLocaleString()}</div>
              <div className="mt-3 flex items-center gap-2">
                <a href={`/admin/articles/show/${a.id}`} className="inline-block"><button className="px-3 py-1 text-xs border border-border rounded">View</button></a>
                <a href={`/admin/articles/edit/${a.id}`} className="inline-block"><button className="px-3 py-1 text-xs border border-border rounded">Edit</button></a>
              </div>
            </div>
          ))}
        </div>
      )}
    </List>
  );
}
