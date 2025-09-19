"use client";

import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Switch, InputNumber, DatePicker, Select } from "antd";
import dayjs from "dayjs";

import type { Campaign } from "../../types";

const { TextArea } = Input;

const LAYOUT_OPTIONS = [
  { label: "Classic (centered)", value: "classic" },
  { label: "Split (media + copy)", value: "split" },
  { label: "Minimal (static image)", value: "minimal" },
];

export default function CampaignCreate() {
  const { formProps, saveButtonProps } = useForm<Campaign>({
    resource: "campaigns",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Create campaign">
      <Form
        {...formProps}
        layout="vertical"
        initialValues={{ active: true, sort_order: 0, layout: "classic", highlight_items: [] }}
      >
        <Form.Item
          label="Slug"
          name="slug"
          extra="Used for identifying the campaign in the storefront; lowercase letters, numbers, hyphens."
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input />
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

        <Form.Item
          label="Layout"
          name="layout"
          extra="Controls how the hero content is composed on the storefront."
          rules={[{ required: true, message: "Layout is required" }]}
        >
          <Select options={LAYOUT_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Badge text"
          name="badge_text"
          extra="Optional label rendered above the title (e.g. ‘New campaign’)."
        >
          <Input maxLength={60} />
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

        <Form.Item
          label="Highlight bullets"
          name="highlight_items"
          extra="Optional supporting lines (one per line)."
          getValueFromEvent={(event) => {
            const value = event?.target?.value as string
            return value
              ? value
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean)
              : []
          }}
          getValueProps={(value) => ({ value: Array.isArray(value) ? value.join('\n') : value ?? '' })}
        >
          <TextArea rows={3} placeholder={`Limited pressing available\nFree AU shipping over $120`} />
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
    </Create>
  );
}
