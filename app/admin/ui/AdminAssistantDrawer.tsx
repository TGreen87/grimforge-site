'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Drawer, Form, Input, List, Modal, Space, Spin, Tag, Typography, Divider, message } from 'antd'
import { SendOutlined, ThunderboltOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface AssistantSource {
  id: string
  title?: string | null
  snippet?: string | null
  similarity?: number
  order: number
}

interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: AssistantSource[]
  actions?: AssistantAction[]
}

interface AdminAssistantDrawerProps {
  open: boolean
  onClose: () => void
}

interface AssistantAction {
  type: string
  summary: string
  parameters: Record<string, unknown>
}

const SUGGESTED_PROMPTS = [
  'How many page views did we get this week?',
  'Walk me through adding a limited vinyl release.',
  'Summarise outstanding tasks from the Implementation Plan.',
  'What should I check before launching a new campaign?'
]

export default function AdminAssistantDrawer({ open, onClose }: AdminAssistantDrawerProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! I can answer questions about the admin panel, spotlight recent analytics, and outline next steps. Ask away or pick a prompt below.',
    },
  ])
  const [form] = Form.useForm<{ prompt: string }>()
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const node = listRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [open, messages])

  const lastAssistantSources = useMemo(() => {
    const reversed = [...messages].reverse()
    const found = reversed.find((msg) => msg.role === 'assistant' && msg.sources?.length)
    return found?.sources ?? []
  }, [messages])

  async function handleSubmit(prompt?: string) {
    const question = prompt ?? form.getFieldValue('prompt')
    if (!question?.trim()) return

    setMessages((current) => [
      ...current,
      { role: 'user', content: question.trim() },
      { role: 'assistant', content: 'Let me check…' },
    ])
    setLoading(true)
    form.resetFields()

    try {
      const response = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: question.trim() }].map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`)
      }

      const data = (await response.json()) as { message: string; sources?: AssistantSource[]; actions?: AssistantAction[] }
      setMessages((current) => {
        const updated = [...current]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: data.message,
          sources: data.sources,
          actions: data.actions,
        }
        return updated
      })
    } catch (error) {
      setMessages((current) => {
        const updated = [...current]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'I hit an error trying to answer that. Double-check your network and try again.',
        }
        return updated
      })
      console.error('Assistant call failed', error)
    } finally {
      setLoading(false)
    }
  }

  async function executeAction(action: AssistantAction) {
    try {
      setActionLoading(true)
      const response = await fetch('/api/admin/assistant/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: action.type, parameters: action.parameters }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json?.error || 'Failed to run action')
      }

      message.success(json?.message || 'Action completed')
      if (json?.message) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: json.message },
        ])
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error'
      message.error(reason)
    } finally {
      setActionLoading(false)
      setPendingAction(null)
    }
  }

  const latestAssistantActions = useMemo(() => {
    const reversed = [...messages].reverse()
    const found = reversed.find((msg) => msg.role === 'assistant' && msg.actions?.length)
    return found?.actions ?? []
  }, [messages])

  return (
    <Drawer
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      title={<Space><ThunderboltOutlined /> <span>Admin Copilot</span></Space>}
      destroyOnClose={false}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 0 } }}
    >
      <div className="space-y-3">
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Ask anything about the store, admin workflows, or current roadmap. I cite the docs I pull from so you can verify.
        </Paragraph>
        <Space wrap>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Button key={prompt} onClick={() => handleSubmit(prompt)} size="small">
              {prompt}
            </Button>
          ))}
        </Space>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: '50vh' }}>
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item className={item.role === 'user' ? 'justify-end' : 'justify-start'} style={{ border: 'none', padding: 0 }}>
              <div
                className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                  item.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-[#141b26] text-slate-200'
                }`}
              >
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{item.content}</Paragraph>
                {item.actions?.length ? (
                  <div className="mt-3 space-y-3">
                    {item.actions.map((action) => (
                      <div key={`${action.type}-${action.summary}`} className="rounded-md border border-border bg-[#0f1624] p-3">
                        <Text strong>{action.summary}</Text>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {Object.entries(action.parameters || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between gap-2">
                              <span className="uppercase tracking-wide">{key}</span>
                              <span className="text-right break-all">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-right">
                          <Button size="small" type="primary" onClick={() => setPendingAction(action)}>
                            Review & Run
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </List.Item>
          )}
        />
      </div>

      <Form form={form} onFinish={() => handleSubmit()} layout="vertical" requiredMark={false}>
        <Form.Item name="prompt" label={null} style={{ marginBottom: 12 }}>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="Type a question for the copilot…"
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault()
                form.submit()
              }
            }}
          />
        </Form.Item>
        <div className="flex items-center justify-between">
          <span>
            {loading ? (
              <Space size="small">
                <Spin size="small" />
                <Text type="secondary">Drafting a reply…</Text>
              </Space>
            ) : lastAssistantSources.length ? (
              <Space size="small" wrap>
                <Text type="secondary">Sources:</Text>
                {lastAssistantSources.map((source) => (
                  <Tag key={source.id} color="geekblue">
                    {source.order}. {source.title}
                  </Tag>
                ))}
              </Space>
            ) : latestAssistantActions.length ? (
              <Space size="small" wrap>
                <Text type="secondary">Suggested actions:</Text>
                {latestAssistantActions.map((action) => (
                  <Tag key={`${action.type}-${action.summary}`} color="cyan">
                    {action.summary}
                  </Tag>
                ))}
              </Space>
            ) : null}
          </span>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
            Send
          </Button>
        </div>
      </Form>

      <Modal
        title="Confirm Action"
        open={!!pendingAction}
        onCancel={() => !actionLoading && setPendingAction(null)}
        onOk={() => pendingAction && executeAction(pendingAction)}
        confirmLoading={actionLoading}
        okText="Run"
        okButtonProps={{ danger: false }}
      >
        {pendingAction && (
          <div className="space-y-3 text-sm">
            <Text strong>{pendingAction.summary}</Text>
            <div className="space-y-1">
              {Object.entries(pendingAction.parameters || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="uppercase tracking-wide text-xs text-muted-foreground">{key}</span>
                  <span className="text-right break-all text-sm">{String(value)}</span>
                </div>
              ))}
            </div>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              The copilot will create a draft product with these details and leave it inactive so you can review before publishing.
            </Paragraph>
          </div>
        )}
      </Modal>
    </Drawer>
  )
}
