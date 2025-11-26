"use client";

import Link from "next/link";
import { Button } from "antd";
import {
  WarningOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { colors } from "../../theme/tokens";

export interface AttentionItem {
  id: string;
  type: "fulfillment" | "lowstock" | "payment" | "webhook" | "system";
  title: string;
  count: number;
  severity: "critical" | "warning" | "info";
  actionLabel: string;
  actionLink: string;
}

function getAttentionIcon(type: string) {
  const iconStyle = { fontSize: 18 };
  switch (type) {
    case "fulfillment":
      return <ShoppingCartOutlined style={iconStyle} />;
    case "lowstock":
      return <InboxOutlined style={iconStyle} />;
    case "payment":
      return <ExclamationCircleOutlined style={iconStyle} />;
    default:
      return <WarningOutlined style={iconStyle} />;
  }
}

function getSeverityColors(severity: string) {
  switch (severity) {
    case "critical":
      return {
        bg: colors.danger.bg,
        border: colors.danger.border,
        text: colors.danger.text,
        glow: `0 0 20px ${colors.danger.text}30`,
      };
    case "warning":
      return {
        bg: colors.warning.bg,
        border: colors.warning.border,
        text: colors.warning.text,
        glow: `0 0 20px ${colors.warning.text}20`,
      };
    default:
      return {
        bg: colors.info.bg,
        border: colors.info.border,
        text: colors.info.text,
        glow: "none",
      };
  }
}

interface AttentionPanelProps {
  items: AttentionItem[];
}

export function AttentionPanel({ items }: AttentionPanelProps) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{
          background: colors.success.bg,
          border: `1px solid ${colors.success.border}`,
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: colors.bg.elevated1 }}
        >
          <span style={{ color: colors.success.text, fontSize: 24 }}>✓</span>
        </div>
        <p
          className="font-medium"
          style={{ color: colors.success.text }}
        >
          All clear!
        </p>
        <p
          className="text-sm mt-1"
          style={{ color: colors.text.medium }}
        >
          Nothing needs your attention right now.
        </p>
      </div>
    );
  }

  // Sort by severity
  const sortedItems = [...items].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-3">
      {sortedItems.map((item) => {
        const severityColors = getSeverityColors(item.severity);

        return (
          <div
            key={item.id}
            className="rounded-lg p-4 transition-all hover:scale-[1.01]"
            style={{
              background: severityColors.bg,
              border: `1px solid ${severityColors.border}`,
              boxShadow: severityColors.glow,
            }}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${severityColors.text}20`,
                  color: severityColors.text,
                }}
              >
                {getAttentionIcon(item.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold"
                    style={{ color: colors.text.high }}
                  >
                    {item.count}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: colors.text.medium }}
                  >
                    {item.title}
                  </span>
                </div>
              </div>

              {/* Action */}
              <Link href={item.actionLink}>
                <Button
                  type="primary"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  style={{
                    background: severityColors.text,
                    borderColor: severityColors.text,
                  }}
                >
                  {item.actionLabel}
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
