"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, InputNumber, Card, Descriptions } from "antd";
import { useShow } from "@refinedev/core";
import type { Inventory } from "../../../types";

export default function InventoryEdit() {
  const { formProps, saveButtonProps } = useForm<Partial<Inventory>>({
    resource: "inventory",
  });

  const { queryResult } = useShow<Inventory>({
    resource: "inventory",
    meta: {
      select: "*, variant:variants(*, product:products(*))",
    },
  });

  const record = queryResult?.data?.data;

  return (
    <Edit saveButtonProps={saveButtonProps}>
      {record && (
        <Card title="Product Information" style={{ marginBottom: 24 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="Product">
              {record.variant?.product?.title}
            </Descriptions.Item>
            <Descriptions.Item label="Variant">{record.variant?.name}</Descriptions.Item>
            <Descriptions.Item label="SKU">{record.variant?.sku}</Descriptions.Item>
            <Descriptions.Item label="Current Stock">{record.on_hand}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Reorder Point"
          name="reorder_point"
          help="Minimum stock level before reordering"
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Reorder Quantity"
          name="reorder_quantity"
          help="Quantity to order when stock reaches reorder point"
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Edit>
  );
}