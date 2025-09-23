"use client";

import { useEffect, useMemo, useState } from "react";
import { List, useTable, DateField } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import {
  Table,
  Tag,
  Space,
  Card,
  Empty,
  Tooltip,
  Button,
  Timeline,
  Typography,
  Spin,
  Descriptions,
  Select,
} from "antd";
import {
  ThunderboltOutlined,
  ReloadOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import AdminTableToolbar, { TableSize } from "../../ui/AdminTableToolbar";
import type {
  AssistantSession,
  AssistantSessionEvent,
  AssistantUpload,
} from "../../types";

const statusColors: Record<string, string> = {
  active: "cyan",
  completed: "green",
  failed: "red",
};

const eventColors: Record<string, string> = {
  "message.user": "blue",
  "message.assistant": "green",
  "action.completed": "cyan",
  "action.failed": "red",
  error: "orange",
};

const storagePublicBase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assistant-media/`
  : null;

export default function AssistantLogsPage() {
  const [size, setSize] = useState<TableSize>("small");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "failed">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { tableProps, tableQueryResult, setFilters, setCurrent } = useTable<AssistantSession>({
    resource: "assistant_sessions",
    sorters: {
      initial: [
        {
          field: "last_event_at",
          order: "desc",
        },
      ],
    },
    pagination: {
      pageSize: 20,
    },
  });

  const sessionRows = tableProps?.dataSource ?? [];

  useEffect(() => {
    if (!selectedSessionId && sessionRows.length) {
      setSelectedSessionId(sessionRows[0].id);
      return;
    }
    if (
      selectedSessionId &&
      sessionRows.length &&
      !sessionRows.some((session) => session.id === selectedSessionId)
    ) {
      setSelectedSessionId(sessionRows[0].id);
    }
    if (sessionRows.length === 0) {
      setSelectedSessionId(null);
    }
  }, [sessionRows, selectedSessionId]);

  const applyFilters = (status: typeof statusFilter, search: string) => {
    const filters: Array<{ field: string; operator: "eq" | "contains"; value: string }> = [];
    if (status !== "all") {
      filters.push({ field: "status", operator: "eq", value: status });
    }
    if (search) {
      filters.push({ field: "title", operator: "contains", value: search });
    }
    setFilters(filters, "replace");
    setCurrent(1);
  };

  const handleStatusChange = (value: "all" | "active" | "completed" | "failed") => {
    setStatusFilter(value);
    applyFilters(value, searchTerm);
  };

  const handleSearch = (value: string) => {
    const trimmed = value.trim();
    setSearchTerm(trimmed);
    applyFilters(statusFilter, trimmed);
  };

  const {
    data: eventsData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useList<AssistantSessionEvent>({
    resource: "assistant_session_events",
    filters: selectedSessionId
      ? [{ field: "session_id", operator: "eq", value: selectedSessionId }]
      : [],
    sorters: [{ field: "occurred_at", order: "desc" }],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: Boolean(selectedSessionId),
      keepPreviousData: true,
    },
  });

  const {
    data: uploadsData,
    isLoading: uploadsLoading,
    refetch: refetchUploads,
  } = useList<AssistantUpload>({
    resource: "assistant_uploads",
    filters: selectedSessionId
      ? [{ field: "session_id", operator: "eq", value: selectedSessionId }]
      : [],
    sorters: [{ field: "uploaded_at", order: "desc" }],
    pagination: { mode: "off" },
    queryOptions: {
      enabled: Boolean(selectedSessionId),
      keepPreviousData: true,
    },
  });

  useEffect(() => {
    if (selectedSessionId) {
      refetchEvents();
      refetchUploads();
    }
  }, [selectedSessionId, refetchEvents, refetchUploads]);

  const totalSessions = tableQueryResult?.data?.total ?? sessionRows.length;
  const selectedSession = useMemo(
    () => sessionRows.find((session) => session.id === selectedSessionId) ?? null,
    [sessionRows, selectedSessionId]
  );

  const events = eventsData?.data ?? [];
  const uploads = uploadsData?.data ?? [];

  return (
    <List
      headerButtons={
        <AdminTableToolbar
          title="Assistant Sessions"
          size={size}
          onSizeChange={setSize}
          onRefresh={() => tableQueryResult?.refetch()}
          onSearch={handleSearch}
          searchPlaceholder="Filter by title (press Enter)"
          count={totalSessions}
          ariaHint="Type at least two characters, press Enter to filter sessions by title."
          rightSlot={
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              options={[
                { label: "All", value: "all" },
                { label: "Active", value: "active" },
                { label: "Completed", value: "completed" },
                { label: "Failed", value: "failed" },
              ]}
              style={{ width: 140 }}
            />
          }
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <Card
          title="Sessions"
          extra={
            <Tooltip title="Refresh sessions">
              <Button icon={<ReloadOutlined />} onClick={() => tableQueryResult?.refetch()} />
            </Tooltip>
          }
          className="h-full"
        >
          <Table
            {...tableProps}
            rowKey="id"
            size={size}
            pagination={tableProps.pagination}
            sticky
            rowClassName={(record, index) =>
              [
                index % 2 === 1 ? "admin-row-zebra" : "",
                record.id === selectedSessionId ? "bg-[#1b283d]" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            rowSelection={{
              type: "radio",
              selectedRowKeys: selectedSessionId ? [selectedSessionId] : [],
              onChange: (keys) => {
                const next = keys[0] as string | undefined;
                setSelectedSessionId(next ?? null);
              },
            }}
            onRow={(record) => ({
              onClick: () => setSelectedSessionId(record.id),
            })}
          >
            <Table.Column
              title="Status"
              dataIndex="status"
              render={(value: string) => (
                <Tag color={statusColors[value] || "default"}>{value}</Tag>
              )}
            />
            <Table.Column
              title="Title"
              dataIndex="title"
              render={(_, record: AssistantSession) => record.title || 'N/A'}
            />
            <Table.Column
              title="Last Event"
              dataIndex="last_event_at"
              render={(value: string) => (
                <Space direction="vertical" size={0}>
                  <DateField value={value} format="YYYY-MM-DD HH:mm:ss" />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(value).fromNow()}
                  </Typography.Text>
                </Space>
              )}
              sorter
            />
            <Table.Column
              title="Created"
              dataIndex="created_at"
              render={(value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm:ss" />}
            />
          </Table>
        </Card>

        <Card
          title="Session Details"
          className="h-full"
          extra={
            selectedSession ? (
              <Space size="small">
                <Tooltip title="Copy session ID">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => navigator.clipboard.writeText(selectedSession.id)}
                  />
                </Tooltip>
                <Tag icon={<ThunderboltOutlined />} color={statusColors[selectedSession.status] || "default"}>
                  {selectedSession.status}
                </Tag>
              </Space>
            ) : null
          }
        >
          {selectedSession ? (
            <Space direction="vertical" size="large" className="w-full">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Session ID">
                  <Typography.Text code>{selectedSession.id}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Last Event">
                  <Space direction="vertical" size={0}>
                    <DateField value={selectedSession.last_event_at} format="YYYY-MM-DD HH:mm:ss" />
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {dayjs(selectedSession.last_event_at).fromNow()}
                    </Typography.Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  <DateField value={selectedSession.created_at} format="YYYY-MM-DD HH:mm:ss" />
                </Descriptions.Item>
                {selectedSession.metadata && (
                  <Descriptions.Item label="Metadata">
                    <pre className="session-metadata-pre" style={{ fontSize: 12, maxHeight: 240, overflow: 'auto', margin: 0 }}>
                      {JSON.stringify(selectedSession.metadata, null, 2)}
                    </pre>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Card
                title="Events"
                extra={
                  <Tooltip title="Refresh events">
                    <Button icon={<ReloadOutlined />} onClick={() => refetchEvents()} />
                  </Tooltip>
                }
              >
                {eventsLoading ? (
                  <Spin />
                ) : events.length === 0 ? (
                  <Empty description="No events recorded for this session yet." />
                ) : (
                  <Timeline
                    mode="left"
                    items={events.map((event) => ({
                      color: eventColors[event.event_type] || 'gray',
                      children: (
                        <div className="space-y-1">
                          <Space size="small">
                            <Tag color={eventColors[event.event_type] || 'default'}>{event.event_type}</Tag>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {dayjs(event.occurred_at).format('YYYY-MM-DD HH:mm:ss')} ({dayjs(event.occurred_at).fromNow()})
                            </Typography.Text>
                          </Space>
                          {event.payload && (
                            <pre className="session-payload-pre" style={{ fontSize: 12, maxHeight: 240, overflow: 'auto', margin: 0 }}>
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      ),
                    }))}
                  />
                )}
              </Card>

              <Card
                title="Uploads"
                extra={
                  <Tooltip title="Refresh uploads">
                    <Button icon={<ReloadOutlined />} onClick={() => refetchUploads()} />
                  </Tooltip>
                }
              >
                {uploadsLoading ? (
                  <Spin />
                ) : uploads.length === 0 ? (
                  <Empty description="No uploads for this session." />
                ) : (
                  <Table
                    dataSource={uploads}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    className="assistant-uploads-table"
                  >
                    <Table.Column
                      title="File"
                      dataIndex="file_name"
                      render={(value: string) => (
                        <Typography.Text>{value}</Typography.Text>
                      )}
                    />
                    <Table.Column
                      title="Size"
                      dataIndex="size_bytes"
                      render={(value: number) => formatBytes(value)}
                    />
                    <Table.Column
                      title="Uploaded"
                      dataIndex="uploaded_at"
                      render={(value: string) => (
                        <Space direction="vertical" size={0}>
                          <DateField value={value} format="YYYY-MM-DD HH:mm:ss" />
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {dayjs(value).fromNow()}
                          </Typography.Text>
                        </Space>
                      )}
                    />
                    <Table.Column
                      title="Open"
                      dataIndex="storage_path"
                      render={(value: string) => {
                        const href = storagePublicBase ? `${storagePublicBase}${value}` : undefined;
                        return (
                          <Button
                            type="link"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            disabled={!href}
                          >
                            View
                          </Button>
                        );
                      }}
                    />
                  </Table>
                )}
              </Card>
            </Space>
          ) : (
            <Empty description="Select a session to inspect details." />
          )}
        </Card>
      </div>
    </List>
  );
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

Typography.Text.defaultProps = Typography.Text.defaultProps || {};
dayjs.extend?.((await import('dayjs/plugin/relativeTime.js')).default ?? (() => {}));
