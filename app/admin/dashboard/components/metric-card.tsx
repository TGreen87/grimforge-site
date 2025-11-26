"use client";

import { ReactNode } from "react";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { colors } from "../../theme/tokens";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number | null;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  accentColor = colors.primary.DEFAULT,
  onClick,
}: MetricCardProps) {
  const isPositive = trend === "up" || (change !== null && change !== undefined && change > 0);
  const isNegative = trend === "down" || (change !== null && change !== undefined && change < 0);

  return (
    <div
      className="admin-metric-card group cursor-pointer transition-all hover:scale-[1.02]"
      onClick={onClick}
      style={{
        ["--accent-color" as string]: accentColor,
      }}
    >
      {/* Accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: colors.text.medium }}
        >
          {title}
        </span>
        {icon && (
          <span style={{ color: colors.text.low, fontSize: 18 }}>{icon}</span>
        )}
      </div>

      {/* Value */}
      <div className="admin-metric-value" style={{ color: colors.text.high }}>
        {value}
      </div>

      {/* Change indicator */}
      {(change !== null && change !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          <span
            className="admin-metric-change flex items-center gap-1"
            style={{
              background: isPositive
                ? colors.success.bg
                : isNegative
                ? colors.danger.bg
                : colors.bg.elevated1,
              color: isPositive
                ? colors.success.text
                : isNegative
                ? colors.danger.text
                : colors.text.medium,
            }}
          >
            {isPositive && <ArrowUpOutlined style={{ fontSize: 10 }} />}
            {isNegative && <ArrowDownOutlined style={{ fontSize: 10 }} />}
            {Math.abs(change).toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs" style={{ color: colors.text.low }}>
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface MetricCardGridProps {
  children: ReactNode;
}

export function MetricCardGrid({ children }: MetricCardGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
