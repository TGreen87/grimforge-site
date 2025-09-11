"use client";

import React, { useState } from "react";
import { List, useTable, TextField, NumberField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Modal, Form, InputNumber, Input, message } from "antd";
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

  return (
    <>
      <List
        headerButtons={
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
        }
      >
        <Table {...tableProps} rowKey="id">
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
    </>
  );
}
