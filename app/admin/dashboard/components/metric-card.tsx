"use client";

import { ReactNode, useMemo } from "react";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { colors } from "../../theme/tokens";

// Simple SVG Sparkline component
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

function Sparkline({
  data,
  width = 80,
  height = 24,
  color = colors.accent.DEFAULT,
  fillOpacity = 0.15,
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return "";

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M${points.join(" L")}`;
  }, [data, width, height]);

  const fillPath = useMemo(() => {
    if (!data || data.length < 2) return "";

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M${padding},${height - padding} L${points.join(" L")} L${width - padding},${height - padding} Z`;
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Fill area */}
      <path d={fillPath} fill={color} fillOpacity={fillOpacity} />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={(width - 2)}
        cy={
          height -
          2 -
          ((data[data.length - 1] - Math.min(...data)) /
            (Math.max(...data) - Math.min(...data) || 1)) *
            (height - 4)
        }
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

// Animated counter hook
function useAnimatedNumber(target: number, duration: number = 500): number {
  const [value, setValue] = useMemo(() => {
    // For SSR, just return target
    return [target, () => {}];
  }, [target]);
  return value;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number | null;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
  onClick?: () => void;
  sparklineData?: number[];
  subtitle?: string;
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
  sparklineData,
  subtitle,
}: MetricCardProps) {
  const isPositive = trend === "up" || (change !== null && change !== undefined && change > 0);
  const isNegative = trend === "down" || (change !== null && change !== undefined && change < 0);

  return (
    <div
      className="admin-metric-card group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        ["--accent-color" as string]: accentColor,
      }}
    >
      {/* Accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, transparent 80%)`,
        }}
      />

      {/* Subtle corner glow on hover */}
      <div
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"
        style={{ background: accentColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: colors.text.medium }}
        >
          {title}
        </span>
        {icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              color: accentColor,
              background: `${accentColor}12`,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value with optional sparkline */}
      <div className="flex items-end justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <div
            className="text-2xl font-bold tracking-tight truncate"
            style={{
              color: colors.text.high,
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div className="text-xs mt-0.5" style={{ color: colors.text.low }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <Sparkline
              data={sparklineData}
              width={64}
              height={28}
              color={
                isPositive
                  ? colors.success.text
                  : isNegative
                  ? colors.danger.text
                  : accentColor
              }
              fillOpacity={0.1}
            />
          </div>
        )}
      </div>

      {/* Change indicator */}
      {change !== null && change !== undefined && (
        <div className="flex items-center gap-2 mt-3 relative z-10">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
            style={{
              background: isPositive
                ? colors.success.bg
                : isNegative
                ? colors.danger.bg
                : colors.bg.elevated2,
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

// Large stat card variant for hero metrics
interface LargeMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  accentColor?: string;
  sparklineData?: number[];
  trend?: {
    value: number;
    label: string;
  };
}

export function LargeMetricCard({
  title,
  value,
  description,
  icon,
  accentColor = colors.accent.DEFAULT,
  sparklineData,
  trend,
}: LargeMetricCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <div
      className="p-6 rounded-xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.bg.elevated0} 0%, ${colors.bg.elevated1} 100%)`,
        border: `1px solid ${colors.border.subtle}`,
      }}
    >
      {/* Accent gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      {/* Background glow */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
        style={{ background: accentColor }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                {icon}
              </span>
            )}
            <span
              className="font-medium text-sm uppercase tracking-wider"
              style={{ color: colors.text.medium }}
            >
              {title}
            </span>
          </div>
          {trend && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
              style={{
                background: isPositive
                  ? colors.success.bg
                  : isNegative
                  ? colors.danger.bg
                  : colors.bg.elevated2,
                color: isPositive
                  ? colors.success.text
                  : isNegative
                  ? colors.danger.text
                  : colors.text.medium,
              }}
            >
              {isPositive && <ArrowUpOutlined style={{ fontSize: 10 }} />}
              {isNegative && <ArrowDownOutlined style={{ fontSize: 10 }} />}
              {Math.abs(trend.value).toFixed(1)}% {trend.label}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div
              className="text-4xl font-bold tracking-tight"
              style={{
                color: colors.text.high,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {value}
            </div>
            {description && (
              <p className="text-sm mt-1" style={{ color: colors.text.medium }}>
                {description}
              </p>
            )}
          </div>

          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline
              data={sparklineData}
              width={100}
              height={40}
              color={
                isPositive
                  ? colors.success.text
                  : isNegative
                  ? colors.danger.text
                  : accentColor
              }
              fillOpacity={0.15}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function MetricCardGrid({ children, columns = 4, stagger = true }: MetricCardGridProps & { stagger?: boolean }) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${stagger ? "admin-stagger" : ""}`}>
      {children}
    </div>
  );
}

// Export Sparkline for use elsewhere
export { Sparkline };
