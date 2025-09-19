"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Input, Switch, InputNumber, DatePicker, Card, Table, Button, Spin, Select } from "antd";
import dayjs from "dayjs";

import type { Campaign, CampaignRevision } from "../../../types";

const { TextArea } = Input;

const LAYOUT_OPTIONS = [
  { label: "Classic (centered)", value: "classic" },
  { label: "Split (media + copy)", value: "split" },
  { label: "Minimal (static image)", value: "minimal" },
];

export default function CampaignEdit() {
  const { formProps, saveButtonProps, queryResult } = useForm<Campaign>({
    resource: "campaigns",
  });

  const record = queryResult?.data?.data
  const campaignId = record?.id

  const { data: revisionsData, isLoading: revisionsLoading, refetch: refetchRevisions } = useList<CampaignRevision>({
    resource: "campaign_revisions",
    filters: [
      {
        field: "campaign_id",
        operator: "eq",
        value: campaignId,
      },
    ],
    sorters: [
      {
        field: "created_at",
        order: "desc",
      },
    ],
    pagination: {
      mode: "off",
    },
    queryOptions: {
      enabled: Boolean(campaignId),
    },
  })

  const revisions = revisionsData?.data ?? []

  const handleRevert = async (revisionId: string) => {
    if (!campaignId) return
    const res = await fetch(`/api/admin/campaigns/${campaignId}/revisions/${revisionId}/revert`, { method: 'POST' })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text)
    }
    refetchRevisions()
    queryResult?.refetch()
  }

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

        <Form.Item label="Internal revision note" name="revision_note" extra="Optional note displayed in revision history.">
          <TextArea rows={2} maxLength={140} />
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

      <Card
        title="Revision history"
        className="mt-8"
        extra={record?.slug ? (
          <Button size="small" href={`/?previewCampaign=${record.slug}`} target="_blank" rel="noreferrer">
            Preview current campaign
          </Button>
        ) : null}
      >
        {revisionsLoading ? (
          <div className="flex justify-center py-6">
            <Spin />
          </div>
        ) : revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revisions captured yet.</p>
        ) : (
          <Table
            dataSource={revisions}
            rowKey="id"
            pagination={false}
            size="small"
          >
            <Table.Column
              title="Saved"
              dataIndex="created_at"
              render={(value: string) => new Date(value).toLocaleString()}
            />
            <Table.Column
              title="Note"
              render={(_, revision: CampaignRevision) => (
                (revision.snapshot?.revision_note as string) || '—'
              )}
            />
            <Table.Column
              title="Actions"
              render={(_, revision: CampaignRevision) => (
                <Button
                  size="small"
                  onClick={async () => {
                    try {
                      await handleRevert(revision.id)
                    } catch (error) {
                      console.error('Revert failed', error)
                    }
                  }}
                >
                  Revert
                </Button>
              )}
            />
          </Table>
        )}
      </Card>
    </Edit>
  );
}
