"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined,
  UserOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { colors } from "../../theme/tokens";

export interface ActivityItem {
  id: string;
  type: "order" | "payment" | "stock" | "customer" | "system" | "alert";
  title: string;
  description?: string;
  timestamp: Date | string;
  link?: string;
  severity?: "info" | "warning" | "success" | "error";
}

function getActivityIcon(type: string, severity?: string): ReactNode {
  const iconStyle = { fontSize: 14 };

  switch (type) {
    case "order":
      return <ShoppingCartOutlined style={iconStyle} />;
    case "payment":
      return <DollarOutlined style={iconStyle} />;
    case "stock":
      return <InboxOutlined style={iconStyle} />;
    case "customer":
      return <UserOutlined style={iconStyle} />;
    case "alert":
      return severity === "success" ? (
        <CheckCircleOutlined style={iconStyle} />
      ) : (
        <WarningOutlined style={iconStyle} />
      );
    default:
      return <CheckCircleOutlined style={iconStyle} />;
  }
}

function getIconBgColor(type: string, severity?: string): string {
  if (severity === "error") return colors.danger.bg;
  if (severity === "warning") return colors.warning.bg;
  if (severity === "success") return colors.success.bg;

  switch (type) {
    case "order":
      return colors.accent.ghost;
    case "payment":
      return colors.success.bg;
    case "stock":
      return colors.warning.bg;
    case "customer":
      return colors.info.bg;
    default:
      return colors.bg.elevated1;
  }
}

function getIconColor(type: string, severity?: string): string {
  if (severity === "error") return colors.danger.text;
  if (severity === "warning") return colors.warning.text;
  if (severity === "success") return colors.success.text;

  switch (type) {
    case "order":
      return colors.accent.DEFAULT;
    case "payment":
      return colors.success.text;
    case "stock":
      return colors.warning.text;
    case "customer":
      return colors.info.text;
    default:
      return colors.text.medium;
  }
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
}

export function ActivityFeed({
  items,
  maxItems = 8,
  showViewAll = true,
  viewAllLink = "/admin/audit-logs",
}: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div
        className="text-center py-8"
        style={{ color: colors.text.low }}
      >
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayItems.map((item, index) => (
        <ActivityItem key={item.id} item={item} isLast={index === displayItems.length - 1} />
      ))}

      {showViewAll && items.length > maxItems && (
        <div className="pt-3">
          <Link
            href={viewAllLink}
            className="text-xs hover:underline flex items-center gap-1"
            style={{ color: colors.accent.DEFAULT }}
          >
            View all activity
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const content = (
    <div className="flex gap-3 py-2 group">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: getIconBgColor(item.type, item.severity),
            color: getIconColor(item.type, item.severity),
          }}
        >
          {getActivityIcon(item.type, item.severity)}
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 mt-1"
            style={{ background: colors.border.subtle }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-sm font-medium group-hover:underline"
            style={{ color: colors.text.high }}
          >
            {item.title}
          </span>
          <span
            className="text-xs whitespace-nowrap flex-shrink-0"
            style={{ color: colors.text.low }}
          >
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </span>
        </div>
        {item.description && (
          <p
            className="text-xs mt-0.5 line-clamp-1"
            style={{ color: colors.text.medium }}
          >
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  if (item.link) {
    return (
      <Link href={item.link} className="block hover:bg-white/5 -mx-2 px-2 rounded transition-colors">
        {content}
      </Link>
    );
  }

  return content;
}
