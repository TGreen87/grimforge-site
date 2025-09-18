"use client";

import React from "react";
import { List, useTable, TextField, DateField } from "@refinedev/antd";
import { Table, Button, Tag, Space, Switch, Tooltip } from "antd";
import { useUpdate } from "@refinedev/core";
import Link from "next/link";

import type { Campaign } from "../types";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import AdminViewToggle, { AdminView, getStoredView } from "../ui/AdminViewToggle";
import EmptyState from "../ui/EmptyState";

const activeColor = {
  active: {
    color: "success",
    label: "Active",
  },
  inactive: {
    color: "default",
    label: "Inactive",
  },
} as const;

export default function CampaignList() {
  const { tableProps, tableQueryResult } = useTable<Campaign>({
    resource: "campaigns",
    sorters: {
      initial: [
        {
          field: "sort_order",
          order: "asc",
        },
      ],
    },
  });

  const { mutate: updateCampaign } = useUpdate();

  const [size, setSize] = React.useState<TableSize>("small");
  const [view, setView] = React.useState<AdminView>(typeof window === "undefined" ? "table" : getStoredView("campaigns"));

  const dataSource = (tableProps.dataSource as Campaign[] | undefined) ?? [];

  const handleToggleActive = (record: Campaign, nextValue: boolean) => {
    updateCampaign(
      {
        resource: "campaigns",
        id: record.id,
        values: {
          active: nextValue,
        },
      },
      {
        onSuccess: () => {
          tableQueryResult?.refetch();
        },
      }
    );
  };

  return (
    <List
      headerButtons={
        <AdminTableToolbar
          title="Campaigns"
          size={size}
          onSizeChange={setSize}
          onRefresh={() => tableQueryResult?.refetch()}
          searchPlaceholder="Search campaigns"
          rightSlot={
            <div className="flex items-center gap-3">
              <Button type="primary">
                <Link href="/admin/campaigns/create">New campaign</Link>
              </Button>
              <AdminViewToggle resource="campaigns" value={view} onChange={setView} />
            </div>
          }
        />
      }
    >
      {view === "table" ? (
        dataSource.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            helper="Create a campaign to control the storefront hero and feature blocks."
            primaryAction={{ label: "Create campaign", href: "/admin/campaigns/create" }}
          />
        ) : (
          <Table
            {...tableProps}
            dataSource={dataSource}
            rowKey="id"
            size={size}
            sticky
            rowClassName={(_, index) => (index % 2 === 1 ? "admin-row-zebra" : "")}
          >
            <Table.Column
              dataIndex="title"
              title="Title"
              render={(value: string) => <TextField value={value} />}
            />
            <Table.Column
              dataIndex="slug"
              title="Slug"
              render={(value: string) => <Tag>{value}</Tag>}
            />
            <Table.Column
              dataIndex="active"
              title="Status"
              render={(_, record: Campaign) => (
                <Space>
                  <Tag color={record.active ? "green" : "default"}>
                    {record.active ? activeColor.active.label : activeColor.inactive.label}
                  </Tag>
                  <Tooltip title={record.active ? "Deactivate" : "Activate"}>
                    <Switch
                      checked={record.active}
                      onChange={(checked) => handleToggleActive(record, checked)}
                      size="small"
                    />
                  </Tooltip>
                </Space>
              )}
            />
            <Table.Column
              dataIndex="starts_at"
              title="Starts"
              render={(value: string | null | undefined) =>
                value ? <DateField value={value} format="YYYY-MM-DD" /> : <span className="text-muted-foreground">—</span>
              }
            />
            <Table.Column
              dataIndex="ends_at"
              title="Ends"
              render={(value: string | null | undefined) =>
                value ? <DateField value={value} format="YYYY-MM-DD" /> : <span className="text-muted-foreground">—</span>
              }
            />
            <Table.Column
              dataIndex="sort_order"
              title="Order"
              render={(value: number) => <TextField value={String(value)} />}
              sorter
            />
            <Table.Column
              dataIndex="updated_at"
              title="Updated"
              render={(value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm" />}
            />
            <Table.Column
              title="Actions"
              render={(_, record: Campaign) => (
                <Space>
                  <Link href={`/admin/campaigns/edit/${record.id}`}>
                    <Button size="small">Edit</Button>
                  </Link>
                </Space>
              )}
            />
          </Table>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dataSource.length === 0 ? (
            <EmptyState
              title="No campaigns yet"
              helper="Create a campaign to control the storefront hero and feature blocks."
              primaryAction={{ label: "Create campaign", href: "/admin/campaigns/create" }}
            />
          ) : (
            dataSource.map((campaign) => (
              <div key={campaign.id} className="rounded-lg border border-border bg-[#0f131a] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-bone text-sm font-semibold">{campaign.title}</div>
                    <div className="text-xs text-muted-foreground">/{campaign.slug}</div>
                  </div>
                  <Tag color={campaign.active ? "green" : "default"}>
                    {campaign.active ? activeColor.active.label : activeColor.inactive.label}
                  </Tag>
                </div>
                {campaign.subtitle ? (
                  <p className="mt-2 text-xs text-muted-foreground">{campaign.subtitle}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Order: {campaign.sort_order}</span>
                  <span>
                    Window: {campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString() : '—'} → {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/campaigns/edit/${campaign.id}`}>
                    <Button size="small" type="primary">Edit</Button>
                  </Link>
                  <Link href={`/?previewCampaign=${campaign.slug}`} target="_blank">
                    <Button size="small" type="default">Preview</Button>
                  </Link>
                  <Switch
                    checked={campaign.active}
                    onChange={(checked) => handleToggleActive(campaign, checked)}
                    size="small"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </List>
  );
}
