"use client";

import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Switch, Select } from "antd";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";
import type { ProductFormValues } from "../../types";

const { TextArea } = Input;

export default function ProductCreate() {
  const { formProps, saveButtonProps } = useForm<ProductFormValues>({
    resource: "products",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
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
        <Form.Item
          label="URL (link)"
          name="slug"
          extra="Appears in the product URL, e.g., /products/your-url — use lowercase words with hyphens."
          rules={[
            { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Use lowercase letters, numbers and hyphens' },
            {
              validator: async (_, value) => {
                if (!value) return Promise.resolve();
                const supabase = getSupabaseBrowserClient();
                const { data } = await supabase.from('products').select('id').eq('slug', value).limit(1);
                if (data && data.length > 0) return Promise.reject('Slug already in use');
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

        <Form.Item label="Stock" name="stock" initialValue={0}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="SKU" name="sku">
          <Input />
        </Form.Item>

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

        <Form.Item label="Active" name="active" valuePropName="checked" initialValue={true}>
          <Switch />
        </Form.Item>

        <Form.Item label="Featured" name="featured" valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>

        <Form.Item label="Limited Edition" name="limited" valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>

        <Form.Item label="Preorder" name="pre_order" valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  );
}
