"use client";

import React from "react";
import { Show } from "@refinedev/antd";
import { useOne } from "@refinedev/core";
import { Typography, Descriptions, Tag } from "antd";

export default function ArticleShow() {
  const { queryResult } = useOne({ resource: "articles" });
  const { data, isLoading } = queryResult;
  const record = data?.data as any;

  return (
    <Show isLoading={isLoading} title={record?.title || 'Article'}>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Title">{record?.title}</Descriptions.Item>
        <Descriptions.Item label="Slug">{record?.slug}</Descriptions.Item>
        <Descriptions.Item label="Author">{record?.author || '—'}</Descriptions.Item>
        <Descriptions.Item label="Published">{record?.published ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>}</Descriptions.Item>
        <Descriptions.Item label="Excerpt">{record?.excerpt || '—'}</Descriptions.Item>
        <Descriptions.Item label="Image URL">{record?.image_url || '—'}</Descriptions.Item>
        <Descriptions.Item label="Content">
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{record?.content}</Typography.Paragraph>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
}
