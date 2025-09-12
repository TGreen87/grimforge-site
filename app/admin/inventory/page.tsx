"use client";

import React, { useState } from "react";
import { List, useTable, TextField, NumberField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Modal, Form, InputNumber, Input, message } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import AdminViewToggle, { AdminView, getStoredView } from "../ui/AdminViewToggle";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";
import type { Inventory, ReceiveStockFormValues } from "../types";

const { TextArea } = Input;

export default function InventoryList() {
  const [isReceiveStockModalOpen, setIsReceiveStockModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [form] = Form.useForm<ReceiveStockFormValues>();

  const { tableProps, tableQueryResult } = useTable<Inventory>({
    resource: "inventory",
    meta: {
      select: "*, variant:variants(*, product:products(*))",
    },
  });

  const handleReceiveStock = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    form.setFieldsValue({
      variant_id: inventory.variant_id,
      quantity: 0,
      notes: "",
    });
    setIsReceiveStockModalOpen(true);
  };

  const handleReceiveStockSubmit = async () => {
    try {
      const values = await form.validateFields();
      const supabase = getSupabaseBrowserClient();
      // Use RPC to atomically receive stock and record movement
      const { data, error: rpcError } = await supabase.rpc('receive_stock', {
        p_variant_id: values.variant_id,
        p_quantity: values.quantity,
        p_notes: values.notes || null,
        p_user_id: null,
      })
      if (rpcError) throw rpcError;

      message.success(`Successfully received ${values.quantity} units`);
      setIsReceiveStockModalOpen(false);
      form.resetFields();
      tableQueryResult.refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      message.error(`Failed to receive stock: ${errorMessage}`);
    }
  };

  const [size, setSize] = useState<TableSize>("small")
  const [view, setView] = useState<AdminView>(typeof window === 'undefined' ? 'table' : getStoredView('inventory'))
  return (
    <>
      <List
        headerButtons={
          <div className="flex w-full items-center justify-between">
            <AdminTableToolbar
              title="Inventory"
              size={size}
              onSizeChange={setSize}
              onRefresh={() => tableQueryResult.refetch()}
              searchPlaceholder="Search inventory"
              rightSlot={<AdminViewToggle resource='inventory' value={view} onChange={setView} />}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedInventory(null);
                form.resetFields();
                setIsReceiveStockModalOpen(true);
              }}
            >
              Receive Stock
            </Button>
          </div>
        }
      >
        {view === 'table' ? (
        <Table {...tableProps} rowKey="id" size={size} sticky rowClassName={(_, index) => (index % 2 === 1 ? 'admin-row-zebra' : '')}>
          <Table.Column
            dataIndex={["variant", "name"]}
            title="Stock Unit"
            render={(value: string) => <TextField value={value} />}
          />
          <Table.Column
            dataIndex={["variant", "product", "title"]}
            title="Product"
            render={(value: string) => <TextField value={value} />}
          />
          <Table.Column
            dataIndex={["variant", "sku"]}
            title="SKU"
            render={(value: string) => <TextField value={value} />}
          />
          <Table.Column
            dataIndex="on_hand"
            title="On Hand"
            render={(value: number) => (
              <Tag color={value > 0 ? "green" : "red"}>
                {value}
              </Tag>
            )}
            sorter
          />
          <Table.Column
            dataIndex="allocated"
            title="Allocated"
            render={(value: number) => <Tag>{value}</Tag>}
          />
          <Table.Column
            dataIndex="available"
            title="Available"
            render={(value: number) => (
              <Tag color={value > 0 ? "green" : "orange"}>
                {value}
              </Tag>
            )}
            sorter
          />
          <Table.Column
            dataIndex="reorder_point"
            title="Reorder Point"
            render={(value: number | null) => (
              <Tag color="blue">{value || "N/A"}</Tag>
            )}
          />
          <Table.Column
            title="Actions"
            dataIndex="actions"
            render={(_, record: Inventory) => (
              <Space>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleReceiveStock(record)}
                >
                  Receive
                </Button>
                <Link href={`/admin/inventory/edit/${record.id}`}>
                  <Button size="small" icon={<EditOutlined />} />
                </Link>
              </Space>
            )}
          />
        </Table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(tableProps.dataSource as Inventory[] | undefined)?.map((inv) => (
              <div key={inv.id} className="border border-border rounded-lg p-4 bg-[#0b0b0b]">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-secondary/30 rounded overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={(inv as any).variant?.product?.image || (inv as any).variant?.product?.image_url || '/placeholder.svg'} alt={(inv as any).variant?.name || 'Stock Unit'} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="m-0 text-bone truncate">{(inv as any).variant?.product?.title || 'Product'}</h4>
                    <div className="text-xs text-muted-foreground truncate">{(inv as any).variant?.name} • { (inv as any).variant?.sku }</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${inv.available > 5 ? 'bg-green-600/20 text-green-300' : inv.available > 0 ? 'bg-yellow-600/20 text-yellow-300' : 'bg-red-600/20 text-red-300'}`}>Available: {inv.available}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-300">On hand: {inv.on_hand}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-600/20 text-gray-300">Allocated: {inv.allocated}</span>
                  </div>
                  <Button size="small" type="primary" onClick={() => handleReceiveStock(inv)}>Receive</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </List>

      <Modal
        title="Receive Stock"
        open={isReceiveStockModalOpen}
        onOk={handleReceiveStockSubmit}
        onCancel={() => {
          setIsReceiveStockModalOpen(false);
          form.resetFields();
        }}
        okText="Receive"
      >
        <Form form={form} layout="vertical">
          {selectedInventory && (
            <div style={{ marginBottom: 16 }}>
              <strong>Product:</strong> {selectedInventory.variant?.product?.title}
              <br />
              <strong>Stock Unit:</strong> {selectedInventory.variant?.name}
              <br />
              <strong>SKU:</strong> {selectedInventory.variant?.sku}
              <br />
              <strong>Current Stock:</strong> {selectedInventory.on_hand}
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                Available is calculated from On hand minus Allocated.
              </div>
            </div>
          )}

          <Form.Item name="variant_id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Quantity to Receive"
            name="quantity"
            rules={[
              { required: true, message: "Quantity is required" },
              { type: "number", min: 1, message: "Quantity must be at least 1" },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Optional notes about this stock receipt" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
