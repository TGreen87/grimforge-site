"use client";

import React from "react";
import { Table, Empty, Skeleton, Input, Tag, Tooltip, Button } from "antd";
import type { TableProps, ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  ExpandOutlined,
  CompressOutlined,
} from "@ant-design/icons";
import { colors } from "../theme/tokens";

interface EnhancedTableProps<T> extends Omit<TableProps<T>, "columns"> {
  columns: ColumnsType<T>;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRefresh?: () => void;
  emptyText?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  expandable?: boolean;
  renderExpandedRow?: (record: T) => React.ReactNode;
  accentColor?: string;
}

// Status badge component for tables
interface StatusBadgeProps {
  status: string;
  type?: "default" | "success" | "warning" | "danger" | "info";
  pulse?: boolean;
}

export function StatusBadge({ status, type = "default", pulse = false }: StatusBadgeProps) {
  const colorMap = {
    default: { bg: colors.bg.elevated2, text: colors.text.medium, dot: colors.text.low },
    success: { bg: colors.success.bg, text: colors.success.text, dot: colors.success.text },
    warning: { bg: colors.warning.bg, text: colors.warning.text, dot: colors.warning.text },
    danger: { bg: colors.danger.bg, text: colors.danger.text, dot: colors.danger.text },
    info: { bg: colors.info.bg, text: colors.info.text, dot: colors.info.text },
  };

  const c = colorMap[type];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`}
        style={{ background: c.dot, boxShadow: pulse ? `0 0 6px ${c.dot}` : undefined }}
      />
      {status}
    </span>
  );
}

// Stock level indicator
interface StockIndicatorProps {
  value: number;
  lowThreshold?: number;
  outOfStockThreshold?: number;
}

export function StockIndicator({
  value,
  lowThreshold = 5,
  outOfStockThreshold = 0,
}: StockIndicatorProps) {
  const isOut = value <= outOfStockThreshold;
  const isLow = value <= lowThreshold && !isOut;

  return (
    <div className="flex items-center gap-2">
      <span
        className="font-mono text-sm font-medium"
        style={{
          color: isOut
            ? colors.danger.text
            : isLow
            ? colors.warning.text
            : colors.text.high,
        }}
      >
        {value}
      </span>
      {isOut && (
        <Tag
          style={{
            background: colors.danger.bg,
            color: colors.danger.text,
            border: `1px solid ${colors.danger.border}`,
            fontSize: 10,
            padding: "0 4px",
            margin: 0,
          }}
        >
          OUT
        </Tag>
      )}
      {isLow && (
        <Tag
          style={{
            background: colors.warning.bg,
            color: colors.warning.text,
            border: `1px solid ${colors.warning.border}`,
            fontSize: 10,
            padding: "0 4px",
            margin: 0,
          }}
        >
          LOW
        </Tag>
      )}
    </div>
  );
}

// Currency display
interface CurrencyDisplayProps {
  value: number;
  currency?: string;
  locale?: string;
  size?: "sm" | "md" | "lg";
}

export function CurrencyDisplay({
  value,
  currency = "AUD",
  locale = "en-AU",
  size = "md",
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base font-medium",
  };

  return (
    <span
      className={`font-mono ${sizeClasses[size]}`}
      style={{ color: colors.text.high }}
    >
      {formatted}
    </span>
  );
}

// Product/Item thumbnail
interface ThumbnailProps {
  src?: string | null;
  alt: string;
  size?: number;
  fallback?: React.ReactNode;
}

export function Thumbnail({ src, alt, size = 40, fallback }: ThumbnailProps) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div
        className="rounded-lg flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: colors.bg.elevated1,
          color: colors.text.low,
          fontSize: size * 0.4,
        }}
      >
        {fallback || "📦"}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

// Primary cell with title and subtitle
interface PrimaryCellProps {
  title: string;
  subtitle?: string;
  thumbnail?: string | null;
  badge?: React.ReactNode;
  href?: string;
}

export function PrimaryCell({ title, subtitle, thumbnail, badge, href }: PrimaryCellProps) {
  const content = (
    <div className="flex items-center gap-3">
      {thumbnail !== undefined && (
        <Thumbnail src={thumbnail} alt={title} size={36} />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-medium truncate"
            style={{ color: colors.text.high }}
          >
            {title}
          </span>
          {badge}
        </div>
        {subtitle && (
          <div
            className="text-xs truncate"
            style={{ color: colors.text.low }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}

// Action buttons group
interface ActionButtonsProps {
  actions: Array<{
    icon: React.ReactNode;
    tooltip: string;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
    disabled?: boolean;
  }>;
}

export function ActionButtons({ actions }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      {actions.map((action, index) => {
        const button = (
          <Tooltip title={action.tooltip} key={index}>
            <Button
              type="text"
              size="small"
              icon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
              danger={action.danger}
              style={{
                color: action.danger ? colors.danger.text : colors.text.medium,
              }}
              className="hover:bg-white/5"
            />
          </Tooltip>
        );

        if (action.href) {
          return (
            <a href={action.href} key={index}>
              {button}
            </a>
          );
        }

        return button;
      })}
    </div>
  );
}

// Main Enhanced Table Component
export function EnhancedTable<T extends object>({
  columns,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  onRefresh,
  emptyText = "No data",
  emptyDescription = "There's nothing here yet",
  emptyIcon,
  title,
  subtitle,
  headerExtra,
  expandable = false,
  renderExpandedRow,
  accentColor = colors.accent.DEFAULT,
  loading,
  dataSource,
  ...tableProps
}: EnhancedTableProps<T>) {
  const [searchValue, setSearchValue] = React.useState("");
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  // Enhanced columns with styling
  const enhancedColumns = columns.map((col) => ({
    ...col,
    title: (
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: colors.text.medium }}
      >
        {col.title as React.ReactNode}
      </span>
    ),
  }));

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: colors.bg.elevated0,
        border: `1px solid ${colors.border.subtle}`,
      }}
    >
      {/* Header */}
      {(title || searchable || headerExtra) && (
        <div
          className="px-4 py-3 flex items-center justify-between gap-4 relative"
          style={{ borderBottom: `1px solid ${colors.border.subtle}` }}
        >
          {/* Accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: `linear-gradient(90deg, ${accentColor}, transparent 50%)`,
            }}
          />

          <div className="flex items-center gap-4">
            {title && (
              <div>
                <h3
                  className="text-base font-semibold"
                  style={{ color: colors.text.high }}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs" style={{ color: colors.text.low }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {searchable && (
              <Input
                placeholder={searchPlaceholder}
                prefix={<SearchOutlined style={{ color: colors.text.low }} />}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                style={{
                  width: 220,
                  background: colors.bg.elevated1,
                  borderColor: colors.border.subtle,
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {headerExtra}

            {onRefresh && (
              <Tooltip title="Refresh">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  style={{ color: colors.text.medium }}
                />
              </Tooltip>
            )}

            {expandable && (
              <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
                <Button
                  type="text"
                  size="small"
                  icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{ color: colors.text.medium }}
                />
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="p-6">
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ) : !dataSource || dataSource.length === 0 ? (
        <div className="py-12">
          <Empty
            image={
              emptyIcon || (
                <div
                  className="text-4xl mb-4"
                  style={{ color: colors.text.low }}
                >
                  📋
                </div>
              )
            }
            description={
              <div>
                <p
                  className="text-base font-medium"
                  style={{ color: colors.text.high }}
                >
                  {emptyText}
                </p>
                <p className="text-sm mt-1" style={{ color: colors.text.medium }}>
                  {emptyDescription}
                </p>
              </div>
            }
          />
        </div>
      ) : (
        <Table<T>
          {...tableProps}
          columns={enhancedColumns}
          dataSource={dataSource}
          loading={loading}
          size="small"
          pagination={{
            size: "small",
            showSizeChanger: false,
            showTotal: (total) => (
              <span style={{ color: colors.text.medium }}>
                {total} item{total !== 1 ? "s" : ""}
              </span>
            ),
            ...tableProps.pagination,
          }}
          rowClassName={(_, index) =>
            index % 2 === 1 ? "admin-row-zebra" : ""
          }
          expandable={
            renderExpandedRow
              ? {
                  expandedRowRender: renderExpandedRow,
                  expandRowByClick: true,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

export default EnhancedTable;
