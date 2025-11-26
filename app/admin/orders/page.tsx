"use client";

import React from "react";
import { List, useTable, TextField, NumberField, DateField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Select, Dropdown, Modal, Form, Input, Segmented } from "antd";
import type { MenuProps, FormInstance } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import { EyeOutlined, TableOutlined, AppstoreOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useUpdate } from "@refinedev/core";
import { message } from "antd";
import type { Order, OrderItem } from "../types";
import EmptyState from "../ui/EmptyState";
import { OrderKanban, type OrderForKanban } from "./components/OrderKanban";
import { colors } from "../theme/tokens";

const statusColors: Record<string, string> = {
  pending: "orange",
  paid: "green",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
};

type ViewMode = "table" | "kanban";

export default function OrderList() {
  const { tableProps, tableQueryResult } = useTable<Order>({
    resource: "orders",
    meta: {
      select: "*, customer:customers(*), order_items(*, variant:variants(*))",
    },
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  const { mutate: updateOrder } = useUpdate();

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    return new Promise<void>((resolve, reject) => {
      updateOrder(
        {
          resource: "orders",
          id: orderId,
          values: {
            status: newStatus,
            updated_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            resolve();
          },
          onError: (error: unknown) => {
            reject(error);
          },
        }
      );
    });
  };

  const [size, setSize] = React.useState<TableSize>("small");
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");
  const [paymentFilter, setPaymentFilter] = React.useState<"all" | "pending" | "paid" | "failed">("all");
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [reasonModalOpen, setReasonModalOpen] = React.useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = React.useState<string | null>(null);
  const [reasonForm] = Form.useForm<{ reason?: string }>();

  const bulkMenuItems = React.useMemo<MenuProps["items"]>(
    () => [
      { key: "processing", label: "Mark processing" },
      { key: "shipped", label: "Mark shipped" },
      { key: "delivered", label: "Mark delivered" },
      { type: "divider" },
      { key: "cancelled", label: "Mark cancelled", danger: true },
      { key: "refunded", label: "Mark refunded", danger: true },
    ],
    []
  );

  const orders = React.useMemo(
    () => (tableProps.dataSource as Order[] | undefined) ?? [],
    [tableProps.dataSource]
  );

  const filteredOrders = React.useMemo(() => {
    if (paymentFilter === "all") return orders;
    if (paymentFilter === "failed") {
      return orders.filter(
        (order) =>
          order.payment_status && !["paid", "pending"].includes(order.payment_status)
      );
    }
    return orders.filter((order) => order.payment_status === paymentFilter);
  }, [orders, paymentFilter]);

  const performBulkStatusChange = async (status: string, reason?: string) => {
    if (selectedRowKeys.length === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/admin/orders/bulk/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedRowKeys, status, reason }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        message.error(`Bulk update failed: ${errorText}`);
      } else {
        message.success(`${selectedRowKeys.length} orders updated`);
        setSelectedRowKeys([]);
        tableQueryResult.refetch();
      }
    } catch (error) {
      message.error("Bulk update failed");
      console.error(error);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (selectedRowKeys.length === 0) return;
    if (key === "cancelled" || key === "refunded") {
      setPendingBulkStatus(key);
      reasonForm.resetFields();
      setReasonModalOpen(true);
      return;
    }
    performBulkStatusChange(key);
  };

  return (
    <>
      <List
        headerButtons={
          <AdminTableToolbar
            title="Orders"
            size={size}
            onSizeChange={setSize}
            onRefresh={() => tableQueryResult.refetch()}
            searchPlaceholder="Search orders"
            rightSlot={
              <div className="flex items-center gap-3">
                {/* Payment filter */}
                <Select
                  value={paymentFilter}
                  onChange={(value) => setPaymentFilter(value)}
                  style={{ minWidth: 140 }}
                  size="small"
                >
                  <Select.Option value="all">All payments</Select.Option>
                  <Select.Option value="paid">Paid</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="failed">Failed / Other</Select.Option>
                </Select>

                {/* Bulk actions (only in table view) */}
                {viewMode === "table" && (
                  <Dropdown
                    menu={{
                      items: bulkMenuItems,
                      onClick: handleBulkMenuClick,
                    }}
                    disabled={selectedRowKeys.length === 0}
                  >
                    <Button loading={bulkUpdating} size="small">
                      Bulk ({selectedRowKeys.length})
                    </Button>
                  </Dropdown>
                )}

                {/* View toggle */}
                <Segmented
                  size="small"
                  value={viewMode}
                  onChange={(value) => setViewMode(value as ViewMode)}
                  options={[
                    {
                      value: "table",
                      icon: <TableOutlined />,
                      label: "Table",
                    },
                    {
                      value: "kanban",
                      icon: <AppstoreOutlined />,
                      label: "Kanban",
                    },
                  ]}
                />
              </div>
            }
          />
        }
      >
        {viewMode === "table" ? (
          filteredOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              helper="When customers buy, orders appear here."
            />
          ) : (
            <Table
              {...tableProps}
              dataSource={filteredOrders}
              rowKey="id"
              size={size}
              sticky
              rowClassName={(_, index) => (index % 2 === 1 ? "admin-row-zebra" : "")}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
            >
              <Table.Column
                dataIndex="order_number"
                title="Order"
                render={(value: string | null, record: Order) => (
                  <Link
                    href={`/admin/orders/show/${record.id}`}
                    className="font-mono hover:underline"
                    style={{ color: colors.accent.DEFAULT }}
                  >
                    {value || record.id.slice(0, 8)}
                  </Link>
                )}
              />
              <Table.Column
                dataIndex={["customer", "email"]}
                title="Customer"
                render={(value: string | null) => (
                  <TextField value={value || "Guest"} />
                )}
              />
              <Table.Column
                dataIndex="status"
                title="Status"
                render={(value: string, record: Order) => (
                  <Select
                    value={value}
                    onChange={(newStatus) =>
                      handleStatusChange(record.id, newStatus)
                        .then(() => {
                          message.success("Status updated");
                          tableQueryResult.refetch();
                        })
                        .catch((e) => message.error("Failed to update status"))
                    }
                    style={{ width: 120 }}
                    size="small"
                  >
                    {Object.entries(statusColors).map(([status, color]) => (
                      <Select.Option key={status} value={status}>
                        <Tag color={color} style={{ margin: 0 }}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Tag>
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
              <Table.Column
                dataIndex="payment_status"
                title="Payment"
                render={(value: string) => (
                  <Tag
                    color={
                      value === "paid"
                        ? "green"
                        : value === "pending"
                        ? "orange"
                        : "red"
                    }
                  >
                    {value || "pending"}
                  </Tag>
                )}
              />
              <Table.Column
                dataIndex="total"
                title="Total"
                render={(value: number) => (
                  <NumberField
                    value={value}
                    options={{ style: "currency", currency: "AUD" }}
                  />
                )}
                sorter
              />
              <Table.Column
                dataIndex="order_items"
                title="Items"
                render={(items: OrderItem[] | null) => (
                  <Tag>{items?.length || 0} items</Tag>
                )}
              />
              <Table.Column
                dataIndex="created_at"
                title="Date"
                render={(value: string) => (
                  <DateField value={value} format="YYYY-MM-DD HH:mm" />
                )}
                sorter
              />
              <Table.Column
                title="Actions"
                dataIndex="actions"
                render={(_, record: Order) => (
                  <Space>
                    <Link href={`/admin/orders/show/${record.id}`}>
                      <Button size="small" icon={<EyeOutlined />}>
                        View
                      </Button>
                    </Link>
                    {(() => {
                      const url =
                        record.metadata && typeof record.metadata === "object"
                          ? (record.metadata as Record<string, unknown>)
                              .stripe_session_url
                          : null;
                      if (typeof url === "string" && url) {
                        return (
                          <Button
                            size="small"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Stripe
                          </Button>
                        );
                      }
                      if (record.stripe_session_id) {
                        const dashboardUrl = `https://dashboard.stripe.com/payments/${
                          record.stripe_payment_intent_id || record.stripe_session_id
                        }`;
                        return (
                          <Button
                            size="small"
                            href={dashboardUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Stripe
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </Space>
                )}
              />
            </Table>
          )
        ) : (
          <OrderKanban
            orders={filteredOrders as OrderForKanban[]}
            onStatusChange={handleStatusChange}
            onRefresh={() => tableQueryResult.refetch()}
          />
        )}
      </List>

      <BulkReasonModal
        open={reasonModalOpen}
        loading={bulkUpdating}
        form={reasonForm}
        status={pendingBulkStatus}
        onCancel={() => {
          if (!bulkUpdating) {
            setReasonModalOpen(false);
            setPendingBulkStatus(null);
          }
        }}
        onSubmit={(values) => {
          if (!pendingBulkStatus) return;
          performBulkStatusChange(pendingBulkStatus, values.reason);
          setReasonModalOpen(false);
          setPendingBulkStatus(null);
        }}
      />
    </>
  );
}

function BulkReasonModal({
  open,
  onCancel,
  onSubmit,
  loading,
  form,
  status,
}: {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: { reason?: string }) => void;
  loading: boolean;
  form: FormInstance<{ reason?: string }>;
  status: string | null;
}) {
  const title =
    status === "refunded" ? "Add refund note" : "Add cancellation note";

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Apply"
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onSubmit(values);
          })
          .catch(() => null);
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Reason"
          name="reason"
          rules={[
            { required: true, message: "Please provide context for this action." },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="e.g., Customer requested cancellation."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
