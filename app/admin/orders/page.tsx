"use client";

import React from "react";
import { List, useTable, TextField, NumberField, DateField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Select, Dropdown, Modal, Form, Input } from "antd";
import type { MenuProps, FormInstance } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import AdminViewToggle, { AdminView, getStoredView } from "../ui/AdminViewToggle";
import { EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useUpdate } from "@refinedev/core";
import { message } from "antd";
import type { Order, OrderItem } from "../types";
import EmptyState from "../ui/EmptyState";

const statusColors: Record<string, string> = {
  pending: "orange",
  paid: "green",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
};

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

  const handleStatusChange = (orderId: string, newStatus: string) => {
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
          message.success("Order status updated successfully");
          tableQueryResult.refetch();
        },
        onError: (error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          message.error(`Failed to update order status: ${errorMessage}`);
        },
      }
    );
  };

  const [size, setSize] = React.useState<TableSize>("small")
  const [view, setView] = React.useState<AdminView>(typeof window === 'undefined' ? 'table' : getStoredView('orders'))
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [overStatus, setOverStatus] = React.useState<string | null>(null)
  const [ariaMsg, setAriaMsg] = React.useState<string>("")
  const [paymentFilter, setPaymentFilter] = React.useState<'all' | 'pending' | 'paid' | 'failed'>('all')
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([])
  const [bulkUpdating, setBulkUpdating] = React.useState(false)
  const [reasonModalOpen, setReasonModalOpen] = React.useState(false)
  const [pendingBulkStatus, setPendingBulkStatus] = React.useState<string | null>(null)
  const [reasonForm] = Form.useForm<{ reason?: string }>()

  const bulkMenuItems = React.useMemo<MenuProps['items']>(
    () => [
      { key: 'shipped', label: 'Mark shipped' },
      { key: 'cancelled', label: 'Mark cancelled' },
      { key: 'refunded', label: 'Mark refunded' },
    ],
    []
  )

  const orders = React.useMemo(() => (tableProps.dataSource as Order[] | undefined) ?? [], [tableProps.dataSource])
  const filteredOrders = React.useMemo(() => {
    if (paymentFilter === 'all') return orders
    if (paymentFilter === 'failed') {
      return orders.filter((order) => order.payment_status && !['paid', 'pending'].includes(order.payment_status))
    }
    return orders.filter((order) => order.payment_status === paymentFilter)
  }, [orders, paymentFilter])

  const onDropChangeStatus = (status: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    updateOrder(
      {
        resource: 'orders',
        id,
        values: { status, updated_at: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          message.success(`Order moved to ${status}`);
          tableQueryResult.refetch();
          setAriaMsg(`Moved order ${id.substring(0,8)} to ${status}`);
        },
      }
    );
  }
  const performBulkStatusChange = async (status: string, reason?: string) => {
    if (selectedRowKeys.length === 0) return
    setBulkUpdating(true)
    try {
      const res = await fetch('/api/admin/orders/bulk/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedRowKeys, status, reason }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        message.error(`Bulk update failed: ${errorText}`)
      } else {
        message.success('Order statuses updated')
        setSelectedRowKeys([])
        tableQueryResult.refetch()
      }
    } catch (error) {
      message.error('Bulk update failed')
      console.error(error)
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleBulkMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (selectedRowKeys.length === 0) return
    if (key === 'cancelled' || key === 'refunded') {
      setPendingBulkStatus(key)
      reasonForm.resetFields()
      setReasonModalOpen(true)
      return
    }
    performBulkStatusChange(key)
  }

  return (
    <>
      <style jsx global>{`
        .kanban-card { transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease; }
        .kanban-card.dragging { transform: scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35); background-color: #121212; }
        .kanban-column { transition: border-color 120ms ease, background-color 120ms ease; border: 1px solid var(--border, #1f2937); }
        .kanban-column.drop-target { border-color: #8B0000; background-color: rgba(139,0,0,0.08); }
      `}</style>
      <List headerButtons={<AdminTableToolbar title="Orders" size={size} onSizeChange={setSize} onRefresh={() => tableQueryResult.refetch()} searchPlaceholder="Search orders" rightSlot={<div className="flex items-center gap-3">
        <Select
          value={paymentFilter}
          onChange={(value) => setPaymentFilter(value)}
          style={{ minWidth: 160 }}
          size="small"
        >
          <Select.Option value="all">All payments</Select.Option>
          <Select.Option value="paid">Paid</Select.Option>
          <Select.Option value="pending">Pending</Select.Option>
          <Select.Option value="failed">Failed / Other</Select.Option>
        </Select>
        <Dropdown
          menu={{
            items: bulkMenuItems,
            onClick: handleBulkMenuClick,
          }}
          disabled={selectedRowKeys.length === 0}
        >
          <Button loading={bulkUpdating}>
            Bulk actions ({selectedRowKeys.length})
          </Button>
        </Dropdown>
        <AdminViewToggle resource='orders' value={view} onChange={setView} allowBoard />
      </div>} />}>
      {view === 'table' ? (
      (filteredOrders.length === 0) ? (
        <EmptyState title="No orders yet" helper="When customers buy, orders appear here." />
      ) : (
      <Table
        {...tableProps}
        dataSource={filteredOrders}
        rowKey="id"
        size={size}
        sticky
        rowClassName={(_, index) => (index % 2 === 1 ? 'admin-row-zebra' : '')}
        rowSelection={view === 'table' ? {
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        } : undefined}
      >
        <Table.Column
          dataIndex="id"
          title="Order ID"
          render={(value: string) => <TextField value={value?.substring(0, 8) + "..."} />}
        />
        <Table.Column
          dataIndex={["customer", "email"]}
          title="Customer"
          render={(value: string | null) => <TextField value={value || "Guest"} />}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value: string, record: Order) => (
            <Select
              value={value}
              onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
              style={{ width: 120 }}
            >
              <Select.Option value="pending">
                <Tag color={statusColors.pending}>Pending</Tag>
              </Select.Option>
              <Select.Option value="paid">
                <Tag color={statusColors.paid}>Paid</Tag>
              </Select.Option>
              <Select.Option value="processing">
                <Tag color={statusColors.processing}>Processing</Tag>
              </Select.Option>
              <Select.Option value="shipped">
                <Tag color={statusColors.shipped}>Shipped</Tag>
              </Select.Option>
              <Select.Option value="delivered">
                <Tag color={statusColors.delivered}>Delivered</Tag>
              </Select.Option>
              <Select.Option value="cancelled">
                <Tag color={statusColors.cancelled}>Cancelled</Tag>
              </Select.Option>
              <Select.Option value="refunded">
                <Tag color={statusColors.refunded}>Refunded</Tag>
              </Select.Option>
            </Select>
          )}
        />
        <Table.Column
          dataIndex="total"
          title="Total"
          render={(value: number) => (
            <NumberField value={value} options={{ style: "currency", currency: "AUD" }} />
          )}
          sorter
        />
        <Table.Column
          dataIndex="order_items"
          title="Items"
          render={(items: OrderItem[] | null) => <Tag>{items?.length || 0} items</Tag>}
        />
        <Table.Column
          dataIndex="created_at"
          title="Date"
          render={(value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm" />}
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
                const url = record.metadata && typeof record.metadata === 'object'
                  ? (record.metadata as Record<string, unknown>).stripe_session_url
                  : null
                if (typeof url === 'string' && url) {
                  return (
                    <Button size="small" href={url} target="_blank" rel="noreferrer">
                      Stripe
                    </Button>
                  )
                }
                if (record.stripe_session_id) {
                  const dashboardUrl = `https://dashboard.stripe.com/payments/${record.stripe_payment_intent_id || record.stripe_session_id}`
                  return (
                    <Button size="small" href={dashboardUrl} target="_blank" rel="noreferrer">
                      Stripe
                    </Button>
                  )
                }
                return null
              })()}
            </Space>
          )}
        />
      </Table>
      )
      ) : (
        filteredOrders.length === 0 ? (
          <EmptyState title="No orders yet" helper="When customers buy, orders appear here." />
        ) : (
        <div className="flex gap-4 overflow-auto" style={{ paddingBottom: 8 }}>
          {['pending','paid','processing','shipped','delivered'].map((status) => (
            <div key={status}
              className={`kanban-column rounded-lg p-3 bg-[#0b0b0b] ${overStatus===status ? 'drop-target' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => { setOverStatus(status); setAriaMsg(`Over ${status} column`); }}
              onDragLeave={() => setOverStatus(null)}
              onDrop={(e) => { setOverStatus(null); onDropChangeStatus(status, e); }}
              style={{ minWidth: 360 }}
              role="region"
              aria-label={`Orders ${status} column`}
            >
              <div className="text-sm mb-2 font-semibold capitalize">{status}</div>
              <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
                {filteredOrders.filter(o => o.status === status).map((o) => (
                  <div key={o.id}
                    className={`kanban-card p-3 rounded border border-border bg-[#0e0e0e] ${dragId===o.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e)=> { e.dataTransfer.setData('text/plain', o.id); setDragId(o.id); setAriaMsg(`Picked up order ${o.id.substring(0,8)}`); }}
                    onDragEnd={()=> setDragId(null)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono">{o.id.substring(0,8)}…</span>
                      <span>${(o.total as any).toFixed ? (o.total as any).toFixed(2) : o.total} AUD</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{(o as any).customer?.email || 'Guest'}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(o.created_at as any).toLocaleString()}</div>
                    <div className="text-[11px] mt-1">Items: {(o as any).order_items?.length || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )
      )}
      </List>
      <BulkReasonModal
        open={reasonModalOpen}
        loading={bulkUpdating}
        form={reasonForm}
        status={pendingBulkStatus}
        onCancel={() => {
          if (!bulkUpdating) {
            setReasonModalOpen(false)
            setPendingBulkStatus(null)
          }
        }}
        onSubmit={(values) => {
          if (!pendingBulkStatus) return
          performBulkStatusChange(pendingBulkStatus, values.reason)
          setReasonModalOpen(false)
          setPendingBulkStatus(null)
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
  open: boolean
  onCancel: () => void
  onSubmit: (values: { reason?: string }) => void
  loading: boolean
  form: FormInstance<{ reason?: string }>
  status: string | null
}) {
  const title = status === 'refunded' ? 'Add refund note' : 'Add cancellation note'
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
            onSubmit(values)
          })
          .catch(() => null)
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Reason"
          name="reason"
          rules={[{ required: true, message: 'Please provide context for this action.' }]}
        >
          <Input.TextArea rows={4} placeholder="e.g., Customer requested cancellation." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
