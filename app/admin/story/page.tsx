"use client";

import React from "react";
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, message, Typography, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface TimelineEntry {
  id: string;
  year: string;
  title: string;
  description?: string | null;
  sort_order: number;
}

interface TestimonialEntry {
  id: string;
  quote: string;
  author: string;
  sort_order: number;
}

interface NewsletterContent {
  heading: string;
  subheading: string;
  cta_label: string;
}

async function api(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body?.data ?? body;
}

export default function StoryContentPage() {
  const [timeline, setTimeline] = React.useState<TimelineEntry[]>([]);
  const [testimonials, setTestimonials] = React.useState<TestimonialEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [timelineModalOpen, setTimelineModalOpen] = React.useState(false);
  const [testimonialModalOpen, setTestimonialModalOpen] = React.useState(false);
  const [editingTimeline, setEditingTimeline] = React.useState<TimelineEntry | null>(null);
  const [editingTestimonial, setEditingTestimonial] = React.useState<TestimonialEntry | null>(null);

  const [timelineForm] = Form.useForm();
  const [testimonialForm] = Form.useForm();
  const [newsletterForm] = Form.useForm();

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [timelineData, testimonialData, newsletterData] = await Promise.all([
        api('/api/admin/story/timeline'),
        api('/api/admin/story/testimonials'),
        api('/api/admin/story/newsletter'),
      ]);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
      setTestimonials(Array.isArray(testimonialData) ? testimonialData : []);
      if (newsletterData) {
        const parsed = newsletterData as NewsletterContent;
        newsletterForm.setFieldsValue(parsed);
      }
    } catch (error) {
      console.error(error);
      message.error(error instanceof Error ? error.message : 'Failed to load story content');
    } finally {
      setLoading(false);
    }
  }, [newsletterForm]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openTimelineModal = (entry?: TimelineEntry) => {
    setEditingTimeline(entry ?? null);
    timelineForm.resetFields();
    if (entry) {
      timelineForm.setFieldsValue(entry);
    } else {
      timelineForm.setFieldsValue({ sort_order: timeline.length });
    }
    setTimelineModalOpen(true);
  };

  const openTestimonialModal = (entry?: TestimonialEntry) => {
    setEditingTestimonial(entry ?? null);
    testimonialForm.resetFields();
    if (entry) {
      testimonialForm.setFieldsValue(entry);
    } else {
      testimonialForm.setFieldsValue({ sort_order: testimonials.length });
    }
    setTestimonialModalOpen(true);
  };

  const handleTimelineSubmit = async () => {
    try {
      const values = await timelineForm.validateFields();
      if (editingTimeline) {
        await api(`/api/admin/story/timeline/${editingTimeline.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Timeline entry updated');
      } else {
        await api('/api/admin/story/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Timeline entry created');
      }
      setTimelineModalOpen(false);
      loadData();
    } catch (error) {
      if (error instanceof Error && /required/.test(error.message)) return;
      message.error(error instanceof Error ? error.message : 'Failed to save timeline entry');
    }
  };

  const handleTestimonialSubmit = async () => {
    try {
      const values = await testimonialForm.validateFields();
      if (editingTestimonial) {
        await api(`/api/admin/story/testimonials/${editingTestimonial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Testimonial updated');
      } else {
        await api('/api/admin/story/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Testimonial created');
      }
      setTestimonialModalOpen(false);
      loadData();
    } catch (error) {
      if (error instanceof Error && /required/.test(error.message)) return;
      message.error(error instanceof Error ? error.message : 'Failed to save testimonial');
    }
  };

  const deleteTimelineEntry = async (entry: TimelineEntry) => {
    Modal.confirm({
      title: 'Delete timeline entry?',
      content: `Remove “${entry.title}” (${entry.year}) from the label story?`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api(`/api/admin/story/timeline/${entry.id}`, { method: 'DELETE' });
          message.success('Timeline entry removed');
          loadData();
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Failed to delete timeline entry');
        }
      },
    });
  };

  const deleteTestimonial = async (entry: TestimonialEntry) => {
    Modal.confirm({
      title: 'Delete testimonial?',
      content: `Remove quote from ${entry.author}?`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api(`/api/admin/story/testimonials/${entry.id}`, { method: 'DELETE' });
          message.success('Testimonial removed');
          loadData();
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Failed to delete testimonial');
        }
      },
    });
  };

  const handleNewsletterSubmit = async (values: NewsletterContent) => {
    try {
      await api('/api/admin/story/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Newsletter copy saved');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save newsletter copy');
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={2} style={{ margin: 0 }}>Story Content</Typography.Title>
      <Typography.Paragraph type="secondary">
        Manage the label timeline, testimonials, and newsletter CTA copy that appear on the public storefront.
      </Typography.Paragraph>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Spin />
        </div>
      ) : (
        <>
          <Card
            title="Timeline"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openTimelineModal()}>
                Add story point
              </Button>
            }
          >
            <Table dataSource={timeline} rowKey="id" pagination={false} size="small">
              <Table.Column<TimelineEntry> title="Year" dataIndex="year" width={100} />
              <Table.Column<TimelineEntry> title="Title" dataIndex="title" />
              <Table.Column<TimelineEntry> title="Description" dataIndex="description" />
              <Table.Column<TimelineEntry> title="Order" dataIndex="sort_order" width={80} />
              <Table.Column<TimelineEntry>
                title="Actions"
                width={150}
                render={(_, record) => (
                  <Space size="small">
                    <Button size="small" onClick={() => openTimelineModal(record)}>Edit</Button>
                    <Button size="small" danger onClick={() => deleteTimelineEntry(record)}>Delete</Button>
                  </Space>
                )}
              />
            </Table>
          </Card>

          <Card
            title="Testimonials"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openTestimonialModal()}>
                Add quote
              </Button>
            }
          >
            <Table dataSource={testimonials} rowKey="id" pagination={false} size="small">
              <Table.Column<TestimonialEntry> title="Quote" dataIndex="quote" />
              <Table.Column<TestimonialEntry> title="Author" dataIndex="author" width={220} />
              <Table.Column<TestimonialEntry> title="Order" dataIndex="sort_order" width={80} />
              <Table.Column<TestimonialEntry>
                title="Actions"
                width={150}
                render={(_, record) => (
                  <Space size="small">
                    <Button size="small" onClick={() => openTestimonialModal(record)}>Edit</Button>
                    <Button size="small" danger onClick={() => deleteTestimonial(record)}>Delete</Button>
                  </Space>
                )}
              />
            </Table>
          </Card>

          <Card title="Newsletter CTA">
            <Form form={newsletterForm} layout="vertical" onFinish={handleNewsletterSubmit}>
          <Form.Item name="heading" label="Heading" rules={[{ required: true, message: 'Heading is required' }]}>
            <Input placeholder="Newsletter heading" />
          </Form.Item>
          <Form.Item name="subheading" label="Subheading" rules={[{ required: true, message: 'Subheading is required' }]}>
            <Input.TextArea rows={3} placeholder="Describe what subscribers receive" />
          </Form.Item>
          <Form.Item name="cta_label" label="CTA Label" rules={[{ required: true, message: 'CTA label is required' }]}>
            <Input placeholder="Button label" />
          </Form.Item>
              <Button type="primary" htmlType="submit">
                Save newsletter copy
              </Button>
            </Form>
          </Card>
        </>
      )}

      <Modal
        title={editingTimeline ? 'Edit timeline entry' : 'Add timeline entry'}
        open={timelineModalOpen}
        onCancel={() => setTimelineModalOpen(false)}
        onOk={handleTimelineSubmit}
        okText="Save"
      >
        <Form form={timelineForm} layout="vertical">
          <Form.Item name="year" label="Year" rules={[{ required: true, message: 'Year is required' }]}>
            <Input placeholder="Year" />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="Timeline title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional summary" />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort order" rules={[{ required: true, message: 'Sort order is required' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingTestimonial ? 'Edit testimonial' : 'Add testimonial'}
        open={testimonialModalOpen}
        onCancel={() => setTestimonialModalOpen(false)}
        onOk={handleTestimonialSubmit}
        okText="Save"
      >
        <Form form={testimonialForm} layout="vertical">
          <Form.Item name="quote" label="Quote" rules={[{ required: true, message: 'Quote is required' }]}>
            <Input.TextArea rows={3} placeholder="Customer or press quote" />
          </Form.Item>
          <Form.Item name="author" label="Author" rules={[{ required: true, message: 'Author is required' }]}>
            <Input placeholder="Quoted source" />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort order" rules={[{ required: true, message: 'Sort order is required' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
