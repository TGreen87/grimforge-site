"use client";

import React from "react";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Select } from "antd";
import type { VariantFormValues, Product } from "../../../types";

export default function StockUnitEdit() {
  const { formProps, saveButtonProps, queryResult } = useForm<VariantFormValues>({
    resource: "variants",
  });

  const { selectProps: productSelectProps } = useSelect<Product>({
    resource: "products",
    optionLabel: "title",
    optionValue: "id",
    defaultValue: queryResult?.data?.data?.product_id,
  });

  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Stock Unit">
      <Form {...formProps} layout="vertical">
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Basics</h3>
        <Form.Item
          label="Product"
          name="product_id"
          rules={[{ required: true, message: "Product is required" }]}
        >
          <Select {...productSelectProps} placeholder="Select a product" />
        </Form.Item>

        <Form.Item
          label="Stock Unit Name"
          name="name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="e.g., Black Vinyl, Limited Edition CD" />
        </Form.Item>

        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Identification</h3>
        <Form.Item
          label="SKU"
          name="sku"
          rules={[{ required: true, message: "SKU is required" }]}
        >
          <Input placeholder="e.g., PROD-001-BLK" />
        </Form.Item>

        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Pricing & Attributes</h3>
        <Form.Item
          label="Price (AUD)"
          name="price"
          rules={[{ required: true, message: "Price is required" }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Size" name="size">
          <Input placeholder="e.g., 12 inch, Large" />
        </Form.Item>

        <Form.Item label="Color" name="color">
          <Input placeholder="e.g., Black, Red Splatter" />
        </Form.Item>

        <Form.Item label="Weight (grams)" name="weight" extra="Used for shipping quotes.">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Dimensions" name="dimensions" extra="L×W×H in cm (for shipping quotes).">
          <Input placeholder="e.g., 30x30x1 cm" />
        </Form.Item>

        <Form.Item label="Barcode" name="barcode">
          <Input placeholder="e.g., 1234567890123" />
        </Form.Item>

        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Publishing</h3>
        <Form.Item label="Active" name="active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
}
