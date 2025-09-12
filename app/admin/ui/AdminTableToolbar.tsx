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
  count?: number;
  onSearch?: (q: string) => void;
  newPath?: string;
  ariaHint?: string;
}

export default function AdminTableToolbar({
  title,
  size,
  onSizeChange,
  onRefresh,
  onExport,
  searchPlaceholder = "Search...",
  rightSlot,
  count,
  onSearch,
  newPath,
  ariaHint,
}: AdminTableToolbarProps) {
  const [q, setQ] = React.useState("");
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {title && <h3 className="m-0 text-base text-bone/90">{title}{typeof count==='number' ? ` (${count})` : ''}</h3>}
        <div className="hidden md:block">
          <Input 
            allowClear 
            prefix={<SearchOutlined />} 
            placeholder={searchPlaceholder} 
            style={{ width: 280 }} 
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onPressEnter={()=>{ if (q.trim().length>=2 && onSearch) onSearch(q.trim()); }}
            aria-describedby={ariaHint ? 'toolbar-filter-hint' : undefined}
          />
          {ariaHint && (
            <div id="toolbar-filter-hint" className="sr-only">{ariaHint}</div>
          )}
        </div>
      </div>
      <Space size="small" wrap>
        {onRefresh && (
          <Tooltip title="Refresh">
            <Button icon={<ReloadOutlined />} onClick={onRefresh} />
          </Tooltip>
        )}
        {onExport && (
          <Tooltip title="Export CSV">
            <Button icon={<DownloadOutlined />} onClick={onExport}>
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
        {newPath && (
          <Button type="primary" href={newPath}>New</Button>
        )}
      </Space>
    </div>
  );
}
