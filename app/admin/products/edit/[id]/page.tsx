"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Select } from "antd";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";
import type { ProductFormValues } from "../../../types";

const { TextArea } = Input;

export default function ProductEdit() {
  const { formProps, saveButtonProps, queryResult } = useForm<ProductFormValues>({
    resource: "products",
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onValuesChange={(changed, all) => {
          const t = (all as any)?.title as string | undefined;
          const a = (all as any)?.artist as string | undefined;
          const sku = (all as any)?.sku as string | undefined;
          if ((t || a) && !sku) {
            const slug = `${(a||'').trim()}-${(t||'').trim()}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g,'-')
              .replace(/^-+|-+$/g,'');
            formProps.form?.setFieldsValue({ sku: `${slug}-STD`.toUpperCase() });
          }
        }}
      >
        {/* Basics */}
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Basics</h3>
        <Form.Item
          label="URL (link)"
          name="slug"
          extra="Appears in the product URL, e.g., /products/your-url — use lowercase words with hyphens."
          rules={[
            { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Use lowercase letters, numbers and hyphens' },
            {
              validator: async (_, value) => {
                if (!value) return Promise.resolve();
                const currentId = (queryResult?.data?.data as any)?.id;
                const supabase = getSupabaseBrowserClient();
                let q = supabase.from('products').select('id').eq('slug', value).limit(1);
                const { data } = await q;
                const taken = data && data.length > 0 && data[0].id !== currentId;
                if (taken) return Promise.reject('Slug already in use');
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input addonAfter={<a onClick={(e)=>{e.preventDefault();
            const t = (formProps.form?.getFieldValue('title') as string || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
            formProps.form?.setFieldsValue({ slug: t });
          }}>Generate</a>} />
        </Form.Item>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Artist"
          name="artist"
          rules={[{ required: true, message: "Artist is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={4} />
        </Form.Item>

        {/* Format & Pricing */}
        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Format & Pricing</h3>
        <Form.Item
          label="Format"
          name="format"
          rules={[{ required: true, message: "Format is required" }]}
        >
          <Select>
            <Select.Option value="CD">CD</Select.Option>
            <Select.Option value="Vinyl">Vinyl</Select.Option>
            <Select.Option value="Cassette">Cassette</Select.Option>
            <Select.Option value="Digital">Digital</Select.Option>
            <Select.Option value="Merchandise">Merchandise</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Price (AUD)"
          name="price"
          rules={[{ required: true, message: "Price is required" }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
        </Form.Item>

        {/* Inventory */}
        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Inventory</h3>
        <Form.Item label="Stock" name="stock">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="SKU" name="sku" extra="Auto-suggested from Title/Artist; edit to match your scheme.">
          <Input />
        </Form.Item>

        {/* Media & Metadata */}
        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Media & Metadata</h3>
        <Form.Item label="Release Year" name="release_year">
          <InputNumber min={1900} max={new Date().getFullYear() + 5} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Image URL" name="image">
          <Input />
        </Form.Item>

        <Form.Item label="Tags" name="tags">
          <Select mode="tags" placeholder="Add tags">
            <Select.Option value="black-metal">Black Metal</Select.Option>
            <Select.Option value="death-metal">Death Metal</Select.Option>
            <Select.Option value="doom-metal">Doom Metal</Select.Option>
            <Select.Option value="ambient">Ambient</Select.Option>
            <Select.Option value="experimental">Experimental</Select.Option>
          </Select>
        </Form.Item>

        {/* Publishing */}
        <h3 style={{ marginTop: 16, marginBottom: 8 }}>Publishing</h3>
        <Form.Item label="Active" name="active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Featured" name="featured" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Limited Edition" name="limited" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Preorder" name="pre_order" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
}
