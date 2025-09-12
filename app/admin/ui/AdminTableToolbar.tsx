"use client";
import React from "react";
import { Input, Segmented, Space, Button, Tooltip } from "antd";
import { DownloadOutlined, ColumnHeightOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";

export type TableSize = "small" | "middle" | "large";

interface AdminTableToolbarProps {
  title?: string;
  size: TableSize;
  onSizeChange: (s: TableSize) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  rightSlot?: React.ReactNode;
}

export default function AdminTableToolbar({
  title,
  size,
  onSizeChange,
  onRefresh,
  onExport,
  searchPlaceholder = "Search...",
  rightSlot,
}: AdminTableToolbarProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {title && <h3 className="m-0 text-base text-bone/90">{title}</h3>}
        <div className="hidden md:block">
          <Input allowClear prefix={<SearchOutlined />} placeholder={searchPlaceholder} style={{ width: 280 }} disabled />
        </div>
      </div>
      <Space size="small" wrap>
        {onRefresh && (
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={onRefresh} />
          </Tooltip>
        )}
        {onExport && (
          <Tooltip title="Export CSV (coming soon)">
            <Button icon={<DownloadOutlined />} disabled onClick={onExport}>
              Export
            </Button>
          </Tooltip>
        )}
        <Segmented
          className="admin-density-toggle"
          value={size}
          onChange={(v) => onSizeChange(v as TableSize)}
          options={[
            { label: <span className="flex items-center gap-1"><ColumnHeightOutlined /> Compact</span>, value: "small" },
            { label: "Default", value: "middle" },
            { label: "Comfort", value: "large" },
          ]}
        />
        {rightSlot}
      </Space>
    </div>
  );
}
