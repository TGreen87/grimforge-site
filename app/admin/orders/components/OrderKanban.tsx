"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Button, Tooltip, message } from "antd";
import {
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { colors } from "../../theme/tokens";

export interface OrderForKanban {
  id: string;
  order_number: string | null;
  total: number | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  customer?: {
    id?: string;
    email?: string;
    name?: string;
    phone?: string;
  } | null;
  order_items?: Array<{
    id: string;
    product_name?: string;
    quantity?: number;
  }>;
}

interface OrderKanbanProps {
  orders: OrderForKanban[];
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  onRefresh: () => void;
}

const KANBAN_COLUMNS = [
  { key: "pending", label: "Pending", color: colors.warning.text },
  { key: "paid", label: "Paid", color: colors.success.text },
  { key: "processing", label: "Processing", color: colors.info.text },
  { key: "shipped", label: "Shipped", color: colors.accent.DEFAULT },
  { key: "delivered", label: "Delivered", color: colors.success.text },
] as const;

export function OrderKanban({
  orders,
  onStatusChange,
  onRefresh,
}: OrderKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Group orders by status
  const ordersByStatus = React.useMemo(() => {
    const grouped: Record<string, OrderForKanban[]> = {};
    KANBAN_COLUMNS.forEach((col) => {
      grouped[col.key] = [];
    });

    orders.forEach((order) => {
      const status = order.status || "pending";
      if (grouped[status]) {
        grouped[status].push(order);
      }
    });

    return grouped;
  }, [orders]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, orderId: string) => {
      e.dataTransfer.setData("text/plain", orderId);
      e.dataTransfer.effectAllowed = "move";
      setDraggedId(orderId);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnter = useCallback((columnKey: string) => {
    setOverColumn(columnKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, columnKey: string) => {
      e.preventDefault();
      const orderId = e.dataTransfer.getData("text/plain");

      if (!orderId) return;

      // Find the order
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status === columnKey) {
        setOverColumn(null);
        setDraggedId(null);
        return;
      }

      setIsUpdating(true);
      try {
        await onStatusChange(orderId, columnKey);
        message.success(`Order moved to ${columnKey}`);
        onRefresh();
      } catch (error) {
        message.error("Failed to update order status");
      } finally {
        setIsUpdating(false);
        setOverColumn(null);
        setDraggedId(null);
      }
    },
    [orders, onStatusChange, onRefresh]
  );

  return (
    <div className="admin-kanban-container">
      {KANBAN_COLUMNS.map((column) => (
        <div
          key={column.key}
          className={`admin-kanban-column ${overColumn === column.key ? "drop-target" : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={() => handleDragEnter(column.key)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.key)}
          role="region"
          aria-label={`Orders ${column.label} column`}
        >
          {/* Column Header */}
          <div className="admin-kanban-column-header">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: column.color }}
              />
              <span style={{ color: colors.text.high }}>{column.label}</span>
            </div>
            <span className="admin-kanban-column-count">
              {ordersByStatus[column.key]?.length || 0}
            </span>
          </div>

          {/* Column Body */}
          <div className="admin-kanban-column-body">
            {ordersByStatus[column.key]?.length === 0 ? (
              <div
                className="text-center py-8 text-sm"
                style={{ color: colors.text.low }}
              >
                No orders
              </div>
            ) : (
              ordersByStatus[column.key].map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isDragging={draggedId === order.id}
                  onDragStart={(e) => handleDragStart(e, order.id)}
                  onDragEnd={handleDragEnd}
                  disabled={isUpdating}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface OrderCardProps {
  order: OrderForKanban;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  disabled?: boolean;
}

function OrderCard({
  order,
  isDragging,
  onDragStart,
  onDragEnd,
  disabled,
}: OrderCardProps) {
  const isPaid = order.payment_status === "paid";
  const itemCount = order.order_items?.length || 0;
  const totalQuantity =
    order.order_items?.reduce((sum, item) => sum + (item.quantity || 1), 0) ||
    0;

  return (
    <div
      className={`admin-kanban-card ${isDragging ? "dragging" : ""}`}
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? "not-allowed" : "grab",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="font-mono text-sm font-medium"
          style={{ color: colors.accent.DEFAULT }}
        >
          {order.order_number || order.id.slice(0, 8)}
        </span>
        <div className="flex items-center gap-1">
          {isPaid && (
            <Tooltip title="Paid">
              <DollarOutlined
                style={{ color: colors.success.text, fontSize: 14 }}
              />
            </Tooltip>
          )}
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: colors.text.high }}
          >
            ${order.total?.toFixed(2) || "0.00"}
          </span>
        </div>
      </div>

      {/* Customer info */}
      <div className="mb-2">
        <div
          className="text-sm truncate"
          style={{ color: colors.text.medium }}
        >
          {order.customer?.name || order.customer?.email || "Guest"}
        </div>
        {order.customer?.email && order.customer?.email !== order.customer?.name && (
          <div
            className="text-xs truncate"
            style={{ color: colors.text.low }}
          >
            {order.customer.email}
          </div>
        )}
      </div>

      {/* Items summary */}
      <div
        className="text-xs mb-2 px-2 py-1 rounded"
        style={{
          background: colors.bg.elevated2,
          color: colors.text.medium,
        }}
      >
        {totalQuantity} item{totalQuantity !== 1 ? "s" : ""}{" "}
        {itemCount > 1 && `(${itemCount} lines)`}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: colors.text.low }}>
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </span>
        <div className="flex items-center gap-1">
          {order.customer?.phone && (
            <Tooltip title={`Call ${order.customer.phone}`}>
              <a href={`tel:${order.customer.phone}`}>
                <Button
                  type="text"
                  size="small"
                  icon={<PhoneOutlined style={{ fontSize: 12 }} />}
                  style={{ color: colors.text.low }}
                />
              </a>
            </Tooltip>
          )}
          {order.customer?.email && (
            <Tooltip title={`Email ${order.customer.email}`}>
              <a href={`mailto:${order.customer.email}`}>
                <Button
                  type="text"
                  size="small"
                  icon={<MailOutlined style={{ fontSize: 12 }} />}
                  style={{ color: colors.text.low }}
                />
              </a>
            </Tooltip>
          )}
          <Tooltip title="View order details">
            <Link href={`/admin/orders/show/${order.id}`}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ fontSize: 12 }} />}
                style={{ color: colors.accent.DEFAULT }}
              />
            </Link>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
