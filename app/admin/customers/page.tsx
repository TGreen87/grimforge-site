"use client";

import React from "react";
import { List, useTable, TextField, DateField, NumberField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Segmented, Modal, Input, message } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import AdminViewToggle, { AdminView, getStoredView } from "../ui/AdminViewToggle";
import { EditOutlined, EyeOutlined, FileAddOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { Customer, Order, Address } from "../types";
import EmptyState from "../ui/EmptyState";
import { useUpdate } from "@refinedev/core";

export default function CustomerList() {
  const { tableProps, tableQueryResult } = useTable<Customer>({
    resource: "customers",
    meta: {
      select: "*, orders(id,total,payment_status,created_at), addresses(id)",
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

  const [size, setSize] = React.useState<TableSize>("small");
  const [view, setView] = React.useState<AdminView>(typeof window === "undefined" ? "table" : getStoredView("customers"));
  const [quickFilter, setQuickFilter] = React.useState<"all" | "hasOrders">("all");
  const [noteCustomer, setNoteCustomer] = React.useState<Customer | null>(null);
  const [noteValue, setNoteValue] = React.useState("");
  const { mutate: updateCustomer } = useUpdate();

  const customers = React.useMemo(() => (tableProps.dataSource as Customer[] | undefined) ?? [], [tableProps.dataSource]);
  const filteredForCards = React.useMemo(() => {
    if (quickFilter === "all") return customers;
    return customers.filter((c) => (c.orders?.length ?? 0) > 0);
  }, [customers, quickFilter]);

  const totalSpend = React.useCallback((customer: Customer) => {
    return (customer.orders ?? []).reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  }, []);

  const lastOrder = React.useCallback((customer: Customer) => {
    const list = customer.orders ?? [];
    if (list.length === 0) return null;
    return list.reduce((latest, order) => {
      const currentDate = new Date(order.created_at);
      return currentDate > new Date(latest.created_at) ? order : latest;
    }, list[0]);
  }, []);

  const handleOpenNote = (record: Customer) => {
    setNoteCustomer(record);
    setNoteValue(record.notes ?? "");
  };

  const handleSaveNote = () => {
    if (!noteCustomer) return;
    updateCustomer(
      {
        resource: "customers",
        id: noteCustomer.id,
        values: {
          notes: noteValue,
          updated_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          message.success("Saved customer note");
          setNoteCustomer(null);
          tableQueryResult.refetch();
        },
        onError: (error: unknown) => {
          const msg = error instanceof Error ? error.message : "Unknown error";
          message.error(`Failed to save note: ${msg}`);
        },
      }
    );
  };

  const tableData = customers;

  return (
    <>
      <List
        headerButtons={
          <AdminTableToolbar
            title="Customers"
            size={size}
            onSizeChange={setSize}
            onRefresh={() => tableQueryResult.refetch()}
            searchPlaceholder="Search customers"
            rightSlot={
              <div className="flex items-center gap-2">
                <AdminViewToggle resource="customers" value={view} onChange={setView} />
                {view === "cards" && (
                  <Segmented
                    size="small"
                    value={quickFilter}
                    onChange={(v) => setQuickFilter(v as any)}
                    options={[
                      { label: "All", value: "all" },
                      { label: "Has Orders", value: "hasOrders" },
                    ]}
                  />
                )}
              </div>
            }
          />
        }
      >
        {view === "table" ? (
          tableData.length === 0 ? (
            <EmptyState
              title="No customers yet"
              helper="Customers who check out will appear here."
              secondaryLink={{ label: "Create test order", href: "#" }}
            />
          ) : (
            <Table
              {...tableProps}
              dataSource={tableData}
              rowKey="id"
              size={size}
              sticky
              rowClassName={(_, index) => (index % 2 === 1 ? "admin-row-zebra" : "")}
            >
              <Table.Column
                dataIndex="email"
                title="Email"
                render={(value: string) => <TextField value={value} />}
                sorter
              />
              <Table.Column
                dataIndex="first_name"
                title="First Name"
                render={(value: string | null) => <TextField value={value || "N/A"} />}
                sorter
              />
              <Table.Column
                dataIndex="last_name"
                title="Last Name"
                render={(value: string | null) => <TextField value={value || "N/A"} />}
                sorter
              />
              <Table.Column
                dataIndex="phone"
                title="Phone"
                render={(value: string | null) => <TextField value={value || "N/A"} />}
              />
              <Table.Column
                dataIndex="orders"
                title="Orders"
                render={(orders: Order[] | null) => <Tag>{orders?.length || 0} orders</Tag>}
              />
              <Table.Column
                title="Total spend"
                render={(_, record: Customer) => (
                  <NumberField value={totalSpend(record)} options={{ style: "currency", currency: "AUD" }} />
                )}
              />
              <Table.Column
                title="Last order"
                render={(_, record: Customer) => {
                  const latest = lastOrder(record);
                  return latest ? (
                    <DateField value={latest.created_at} format="YYYY-MM-DD" />
                  ) : (
                    <Tag>No orders</Tag>
                  );
                }}
              />
              <Table.Column
                dataIndex="addresses"
                title="Addresses"
                render={(addresses: Address[] | null) => <Tag>{addresses?.length || 0} addresses</Tag>}
              />
              <Table.Column
                dataIndex="created_at"
                title="Joined"
                render={(value: string) => <DateField value={value} format="YYYY-MM-DD" />}
                sorter
              />
              <Table.Column
                title="Actions"
                dataIndex="actions"
                render={(_, record: Customer) => (
                  <Space>
                    <Link href={`/admin/customers/show/${record.id}`}>
                      <Button size="small" icon={<EyeOutlined />} />
                    </Link>
                    <Link href={`/admin/customers/edit/${record.id}`}>
                      <Button size="small" icon={<EditOutlined />} />
                    </Link>
                    <Button size="small" icon={<FileAddOutlined />} onClick={() => handleOpenNote(record)}>
                      Notes
                    </Button>
                  </Space>
                )}
              />
            </Table>
          )
        ) : (
          filteredForCards.length === 0 ? (
            <EmptyState
              title="No customers yet"
              helper="Customers who check out will appear here."
              secondaryLink={{ label: "Create test order", href: "#" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredForCards.map((c) => (
                <div key={c.id} className="border border-border rounded-lg p-4 bg-[#0b0b0b]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-bone font-semibold truncate">{c.email}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.first_name || "—"} {c.last_name || ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(c.created_at as any).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300">
                      Orders: {c.orders?.length || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-600/20 text-gray-300">
                      Addresses: {c.addresses?.length || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-600/15 text-emerald-300">
                      Spend: ${totalSpend(c).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Last order: {(() => {
                      const latest = lastOrder(c);
                      return latest ? new Date(latest.created_at as any).toLocaleDateString() : "—";
                    })()}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <a href={`/admin/customers/show/${c.id}`} className="inline-block">
                      <button className="px-3 py-1 text-xs border border-border rounded">View</button>
                    </a>
                    <a href={`/admin/customers/edit/${c.id}`} className="inline-block">
                      <button className="px-3 py-1 text-xs border border-border rounded">Edit</button>
                    </a>
                    <button
                      className="px-3 py-1 text-xs border border-border rounded"
                      onClick={() => handleOpenNote(c)}
                    >
                      Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </List>

      <Modal
        title={noteCustomer ? `Notes for ${noteCustomer.email}` : "Customer note"}
        open={!!noteCustomer}
        onOk={handleSaveNote}
        onCancel={() => setNoteCustomer(null)}
        okText="Save note"
        destroyOnClose
      >
        <Input.TextArea
          rows={4}
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          placeholder="Add context for this customer (e.g. preferred shipping, VIP, etc.)"
        />
      </Modal>
    </>
  );
}
