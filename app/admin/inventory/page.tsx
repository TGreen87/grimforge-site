"use client";

import React, { useMemo, useState } from "react";
import { List, useTable, TextField, NumberField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Modal, Form, InputNumber, Input, message, Switch } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";
import type { Inventory, ReceiveStockFormValues } from "../types";

const { TextArea } = Input;

export default function InventoryList() {
  const [isReceiveStockModalOpen, setIsReceiveStockModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm<ReceiveStockFormValues>();

  const { tableProps, tableQueryResult, refineCore } = useTable<Inventory>({
    resource: "inventory",
    meta: {
      select: "*, variant:variants(*, product:products(*))",
    },
    filters: {
      permanent: lowStockOnly
        ? [{ field: 'available', operator: 'lt', value: 'reorder_point' } as any]
        : [],
    } as any,
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
      // Use admin API to perform server-side updates with service role
      const res = await fetch('/api/admin/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ variant_id: values.variant_id, quantity: values.quantity, reason: values.notes }]
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to receive stock');
      }

      message.success(`Successfully received ${values.quantity} units`);
      setIsReceiveStockModalOpen(false);
      form.resetFields();
      tableQueryResult.refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      message.error(`Failed to receive stock: ${errorMessage}`);
    }
  };

  const handleBatchReceive = async () => {
    if (selectedRowKeys.length === 0) {
      message.info('Select at least one row');
      return;
    }
    try {
      const qty = await new Promise<number>((resolve, reject) => {
        let localForm: any;
        const modal = Modal.confirm({
          title: 'Batch Receive Stock',
          content: (
            <Form ref={(f) => (localForm = f as any)} layout="vertical" id="batch-receive-form">
              <Form.Item label="Quantity per item" name="quantity" rules={[{ required: true, message: 'Quantity is required' }]}> 
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Notes" name="notes">
                <Input />
              </Form.Item>
            </Form>
          ),
          okText: 'Receive',
          onOk: async () => {
            const values = await (localForm as any)?.validateFields?.();
            resolve(values.quantity);
          },
          onCancel: () => reject(new Error('cancelled')),
        });
      });

      const items = selectedRowKeys.map((key) => ({ variant_id: String(key), quantity: qty }));
      const res = await fetch('/api/admin/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Batch receive failed');
      }
      message.success(`Received ${qty} units for ${items.length} variants`);
      setSelectedRowKeys([]);
      tableQueryResult.refetch();
    } catch (e: any) {
      if (e?.message !== 'cancelled') message.error(e?.message || 'Batch receive failed');
    }
  };

  const handleAdjustSubmit = async (delta: number, notes?: string) => {
    try {
      if (selectedRowKeys.length === 0) {
        message.info('Select at least one row');
        return;
      }
      const items = selectedRowKeys.map((key) => ({ variant_id: String(key), delta, reason: notes }));
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Adjust failed');
      }
      message.success('Inventory adjusted');
      setIsAdjustModalOpen(false);
      setSelectedRowKeys([]);
      tableQueryResult.refetch();
    } catch (e: any) {
      message.error(e?.message || 'Adjust failed');
    }
  };

  return (
    <>
      <List
        headerButtons={
          <Space>
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
            <Button onClick={handleBatchReceive}>Batch Receive</Button>
            <Button onClick={() => setIsAdjustModalOpen(true)}>Adjust</Button>
            <span style={{ marginLeft: 12 }}>
              Low stock only <Switch checked={lowStockOnly} onChange={(v) => { setLowStockOnly(v); (tableQueryResult as any).refetch?.(); }} />
            </span>
          </Space>
        }
      >
        <Table
          {...tableProps}
          rowKey={(r) => r.variant_id || r.id}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        >
          <Table.Column
            dataIndex={["variant", "name"]}
            title="Variant"
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
              <strong>Variant:</strong> {selectedInventory.variant?.name}
              <br />
              <strong>Current Stock:</strong> {selectedInventory.on_hand}
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

      <Modal
        title="Adjust Inventory"
        open={isAdjustModalOpen}
        onCancel={() => setIsAdjustModalOpen(false)}
        onOk={async () => {
          const values = await form.validateFields().catch(() => null)
          if (!values) return
          const delta = Number(values.quantity || 0) * (values.direction === 'decrease' ? -1 : 1)
          await handleAdjustSubmit(delta, values.notes)
        }}
        okText="Apply"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="direction" label="Direction" initialValue="increase">
            <select defaultValue="increase">
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
          </Form.Item>
          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              { required: true, message: "Quantity is required" },
              { type: "number", min: 1, message: "Quantity must be at least 1" },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input />
          </Form.Item>
          <p style={{ color: '#666' }}>Selected variants: {selectedRowKeys.length}</p>
        </Form>
      </Modal>
    </>
  );
}
