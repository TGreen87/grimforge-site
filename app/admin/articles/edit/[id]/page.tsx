"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch } from "antd";

const { TextArea } = Input;

export default function ArticleEdit() {
  const { formProps, saveButtonProps } = useForm({ resource: "articles" });
  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Article">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Title" name="title" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item 
          label="URL (link)"
          name="slug"
          extra="Appears in the page URL, e.g., /articles/your-url — use lowercase words with hyphens."
          rules={[{ required: true, pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Use lowercase letters, numbers, and hyphens' }]}
        >
          <Input placeholder="e.g. limited-vinyl-restock" />
        </Form.Item>
        <Form.Item label="Author" name="author"> <Input /> </Form.Item>
        <Form.Item label="Excerpt" name="excerpt"> <TextArea rows={3} /> </Form.Item>
        <Form.Item label="Image URL" name="image_url"> <Input /> </Form.Item>
        <Form.Item label="Content (Markdown)" name="content" rules={[{ required: true }]}> <TextArea rows={12} /> </Form.Item>
        <Form.Item label="Published" name="published" valuePropName="checked"> <Switch /> </Form.Item>
      </Form>
    </Edit>
  );
}
