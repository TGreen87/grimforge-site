"use client";

import React from "react";
import { List, useTable, TextField, DateField } from "@refinedev/antd";
import { Table, Tag, Collapse, Typography } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import type { AuditLog } from "../types";

const { Panel } = Collapse;
const { Text } = Typography;

const eventTypeColors: Record<string, string> = {
  "order.created": "blue",
  "order.paid": "green",
  "order.shipped": "purple",
  "order.cancelled": "red",
  "stock.received": "cyan",
  "stock.adjusted": "orange",
  "product.created": "green",
  "product.updated": "blue",
  "product.deleted": "red",
  "user.login": "default",
  "user.logout": "default",
};

export default function AuditLogList() {
  const { tableProps, tableQueryResult } = useTable<AuditLog>({
    resource: "audit_logs",
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
    pagination: {
      pageSize: 50,
    },
  });

  const [size, setSize] = React.useState<TableSize>("small")
  return (
    <List headerButtons={<AdminTableToolbar title="Audit Logs" size={size} onSizeChange={setSize} onRefresh={() => tableQueryResult.refetch()} searchPlaceholder="Filter by type..." />}>
      <Table {...tableProps} rowKey="id" size={size} sticky rowClassName={(_, index) => (index % 2 === 1 ? 'admin-row-zebra' : '')}>
        <Table.Column
          dataIndex="event_type"
          title="Event Type"
          render={(value: string) => (
            <Tag color={eventTypeColors[value] || "default"}>
              {value}
            </Tag>
          )}
          filters={Object.keys(eventTypeColors).map((key) => ({
            text: key,
            value: key,
          }))}
          onFilter={(value, record: AuditLog) => record.event_type === value}
        />
        <Table.Column
          dataIndex="resource_type"
          title="Resource"
          render={(value: string | null) => <TextField value={value || "N/A"} />}
        />
        <Table.Column
          dataIndex="resource_id"
          title="Resource ID"
          render={(value: string | null) => (
            <Text copyable style={{ fontSize: "12px" }}>
              {value ? value.substring(0, 8) + "..." : "N/A"}
            </Text>
          )}
        />
        <Table.Column
          dataIndex="user_id"
          title="User ID"
          render={(value: string | null) => (
            <Text style={{ fontSize: "12px" }}>
              {value ? value.substring(0, 8) + "..." : "System"}
            </Text>
          )}
        />
        <Table.Column
          dataIndex="ip_address"
          title="IP Address"
          render={(value: string | null) => <TextField value={value || "N/A"} />}
        />
        <Table.Column
          dataIndex="created_at"
          title="Timestamp"
          render={(value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm:ss" />}
          sorter
        />
        <Table.Column
          dataIndex="metadata"
          title="Details"
          render={(metadata: Record<string, unknown> | null, record: AuditLog) => (
            <Collapse ghost>
              <Panel header="View Details" key="1">
                {record.changes && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Changes:</strong>
                    <pre style={{ fontSize: "11px", maxHeight: "200px", overflow: "auto" }}>
                      {JSON.stringify(record.changes, null, 2)}
                    </pre>
                  </div>
                )}
                {metadata && (
                  <div>
                    <strong>Metadata:</strong>
                    <pre style={{ fontSize: "11px", maxHeight: "200px", overflow: "auto" }}>
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </Panel>
            </Collapse>
          )}
        />
      </Table>
    </List>
  );
}
