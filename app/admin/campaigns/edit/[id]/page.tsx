"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch, InputNumber, DatePicker } from "antd";
import dayjs from "dayjs";

import type { Campaign } from "../../../types";

const { TextArea } = Input;

export default function CampaignEdit() {
  const { formProps, saveButtonProps } = useForm<Campaign>({
    resource: "campaigns",
  });

  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit campaign">
      <Form
        {...formProps}
        layout="vertical"
      >
        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Subtitle" name="subtitle">
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Hero image URL" name="hero_image_url">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item label="Background video URL" name="background_video_url">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item label="Audio preview URL" name="audio_preview_url">
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item label="Primary CTA label" name="cta_primary_label">
          <Input />
        </Form.Item>

        <Form.Item label="Primary CTA link" name="cta_primary_href">
          <Input placeholder="/products/test-vinyl-dark-rituals" />
        </Form.Item>

        <Form.Item label="Secondary CTA label" name="cta_secondary_label">
          <Input />
        </Form.Item>

        <Form.Item label="Secondary CTA link" name="cta_secondary_href">
          <Input />
        </Form.Item>

        <Form.Item label="Sort order" name="sort_order" extra="Lower numbers appear first">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Active"
          name="active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Starts at"
          name="starts_at"
          getValueFromEvent={(value) => (value ? value.toISOString() : null)}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
        >
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Ends at"
          name="ends_at"
          getValueFromEvent={(value) => (value ? value.toISOString() : null)}
          getValueProps={(value) => ({ value: value ? dayjs(value) : undefined })}
        >
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Edit>
  );
}
