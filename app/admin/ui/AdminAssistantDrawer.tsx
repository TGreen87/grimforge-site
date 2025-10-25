'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Collapse, Drawer, Form, Input, InputNumber, List, Modal, Space, Spin, Switch, Tag, Typography, Divider, Upload, message } from 'antd'
import type { UploadFile, RcFile } from 'antd/es/upload/interface'
import { InboxOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { assistantActionMap } from '@/lib/assistant/actions'
import type { AssistantActionType } from '@/lib/assistant/actions'
import { buildActionPlan } from '@/lib/assistant/plans'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

interface AssistantAttachment {
  uid: string
  name: string
  size: number
  type: string
  url: string
  storagePath: string
}

interface ContextFormValues {
  productTitle?: string
  format?: string
  price?: number
  stock?: number
  publishImmediately?: boolean
  featureOnHero?: boolean
  articleWordCount?: number
  articlePublish?: boolean
  articleTags?: string
}

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
  type: AssistantActionType
  summary: string
  parameters: Record<string, unknown>
}

interface UndoOption {
  token: string
  actionType: AssistantActionType
  expiresAt: string
}

const SUGGESTED_PROMPTS = [
  'How many page views did we get this week?',
  'Walk me through adding a limited vinyl release.',
  'Summarise outstanding tasks from the Implementation Plan.',
  'What should I check before launching a new campaign?'
]

const AUTO_EXECUTE_ACTION_TYPES = new Set<AssistantActionType>([
  'create_product_full',
  'draft_article',
  'publish_article',
  'update_campaign',
])

export default function AdminAssistantDrawer({ open, onClose }: AdminAssistantDrawerProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! I can answer questions about the admin panel, spotlight recent analytics, and outline next steps. Ask away or pick a prompt below.',
    },
  ])
  const [form] = Form.useForm<{ prompt: string }>()
  const [contextForm] = Form.useForm<ContextFormValues>()
  const [actionForm] = Form.useForm<Record<string, unknown>>()
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [uploads, setUploads] = useState<AssistantAttachment[]>([])
  const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [undoOptions, setUndoOptions] = useState<UndoOption[]>([])
  const [undoLoadingToken, setUndoLoadingToken] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const sessionIdRef = useRef<string>(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

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

  useEffect(() => {
    if (pendingAction?.type === 'receive_stock') {
      actionForm.setFieldsValue({
        variant_id: (pendingAction.parameters.variant_id as string | undefined) ?? '',
        quantity:
          typeof pendingAction.parameters.quantity === 'number'
            ? pendingAction.parameters.quantity
            : Number(pendingAction.parameters.quantity) || 1,
        notes: (pendingAction.parameters.notes as string | undefined) ?? '',
      })
    } else if (pendingAction?.type === 'lookup_order_status') {
      actionForm.setFieldsValue({
        order_number: (pendingAction.parameters.order_number as string | undefined) ?? '',
        email: (pendingAction.parameters.email as string | undefined) ?? '',
      })
    } else {
      actionForm.resetFields()
    }
  }, [pendingAction, actionForm])

  const uploadToServer = async (file: RcFile) => {
    setUploading(true)
    let tempUid = ''
    try {
      tempUid = `${Date.now()}-${file.uid}`
      setUploadFileList((current) => [
        ...current,
        {
          uid: tempUid,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploading',
        },
      ])
      const formData = new FormData()
      formData.append('file', file)
      formData.append('intent', pendingAction?.type ?? 'general')
      formData.append('sessionId', sessionIdRef.current)
      const response = await fetch('/api/admin/assistant/uploads', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Upload failed (${response.status})`)
      }

      const data = (await response.json()) as { url: string; path: string }
      const attachment: AssistantAttachment = {
        uid: tempUid,
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.url,
        storagePath: data.path,
      }
      setUploads((current) => [...current.filter((item) => item.uid !== attachment.uid), attachment])
      setUploadFileList((current) => current.map((item) => (item.uid === attachment.uid ? { ...item, status: 'done', url: attachment.url } : item)))
      message.success(`${file.name} uploaded`)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Upload failed'
      message.error(reason)
      setUploadFileList((current) => current.filter((item) => item.uid !== tempUid))
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = async (file: UploadFile) => {
    const target = uploads.find((item) => item.uid === file.uid)
    setUploadFileList((current) => current.filter((item) => item.uid !== file.uid))
    setUploads((current) => current.filter((item) => item.uid !== file.uid))

    if (!target) {
      return
    }

    try {
      const response = await fetch(`/api/admin/assistant/uploads?path=${encodeURIComponent(target.storagePath)}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Failed to delete attachment'
      message.error(reason)
    }
  }

  function formatExpiry(expiresAt: string) {
    const date = new Date(expiresAt)
    if (Number.isNaN(date.getTime())) return expiresAt
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  function buildStructuredContext(prompt: string) {
    const contextValues = contextForm.getFieldsValue()
    const lines: string[] = []

    if (contextValues.productTitle) {
      lines.push(`Product title: ${contextValues.productTitle}`)
    }
    if (contextValues.format) {
      lines.push(`Format: ${contextValues.format}`)
    }
    if (typeof contextValues.price === 'number') {
      lines.push(`Target price: ${contextValues.price}`)
    }
    if (typeof contextValues.stock === 'number') {
      lines.push(`Initial stock: ${contextValues.stock}`)
    }
    if (typeof contextValues.publishImmediately === 'boolean') {
      lines.push(`Publish immediately: ${contextValues.publishImmediately ? 'yes' : 'no'}`)
    }
    if (typeof contextValues.featureOnHero === 'boolean') {
      lines.push(`Feature on hero: ${contextValues.featureOnHero ? 'yes' : 'no'}`)
    }
    if (typeof contextValues.articleWordCount === 'number') {
      lines.push(`Article word target: ${contextValues.articleWordCount}`)
    }
    if (typeof contextValues.articlePublish === 'boolean') {
      lines.push(`Publish article after draft: ${contextValues.articlePublish ? 'yes' : 'no'}`)
    }
    if (contextValues.articleTags) {
      lines.push(`Preferred article tags: ${contextValues.articleTags}`)
    }
    if (uploads.length) {
      lines.push(`Attachments: ${uploads.map((file) => file.name).join(', ')}`)
    }

    if (!lines.length) {
      return prompt.trim()
    }

    return `${prompt.trim()}\n\n[Structured Context]\n${lines.join('\n')}`
  }

  async function handleSubmit(prompt?: string) {
    const questionInput = prompt ?? form.getFieldValue('prompt')
    const question = buildStructuredContext(questionInput || '')
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: question.trim() }].map(({ role, content }) => ({ role, content })),
          sessionId: sessionIdRef.current,
        }),
      })

      const raw = await response.text()
      let parsed: any = null
      if (raw) {
        try {
          parsed = JSON.parse(raw)
        } catch (error) {
          console.error('Failed to parse assistant response', error)
        }
      }

      if (!response.ok) {
        const errorMessage = parsed?.error || `Request failed with ${response.status}`
        if (parsed?.sessionId) {
          sessionIdRef.current = parsed.sessionId
        }
        throw new Error(errorMessage)
      }

      const data = parsed as { message: string; sources?: AssistantSource[]; actions?: AssistantAction[]; sessionId?: string }
      if (data.sessionId) {
        sessionIdRef.current = data.sessionId
      }
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
      if (Array.isArray(data.actions) && data.actions.length) {
        const autoAction = data.actions.find(
          (action) =>
            AUTO_EXECUTE_ACTION_TYPES.has(action.type) &&
            (() => {
              const params = (action.parameters ?? {}) as Record<string, unknown>
              return '__autoExecute' in params ? Boolean(params.__autoExecute) : false
            })(),
        )
        if (autoAction && !actionLoading) {
          void executeAction(autoAction)
        }
      }
    } catch (error) {
      setMessages((current) => {
        const updated = [...current]
        updated[updated.length - 1] = {
          role: 'assistant',
          content:
            error instanceof Error
              ? `I hit an error trying to answer that: ${error.message}`
              : 'I hit an error trying to answer that. Double-check your network and try again.',
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
      const rawParameters = (action.parameters ?? {}) as Record<string, unknown> & { __autoExecute?: unknown }
      const { __autoExecute: _autoExecuteFlag, ...initialParameters } = rawParameters
      let parameters: Record<string, unknown> = { ...initialParameters }

      if (action.type === 'receive_stock') {
        const values = await actionForm.validateFields()
        const variantId = typeof values.variant_id === 'string' ? values.variant_id.trim() : ''
        const quantity = Number(values.quantity)
        parameters = {
          variant_id: variantId,
          quantity,
          ...(values.notes ? { notes: values.notes } : {}),
        }
      } else if (action.type === 'lookup_order_status') {
        const values = await actionForm.validateFields()
        const orderNumber = typeof values.order_number === 'string' ? values.order_number.trim() : ''
        const email = typeof values.email === 'string' ? values.email.trim() : ''
        if (!orderNumber && !email) {
          throw new Error('Provide an order number or customer email')
        }
        parameters = {
          ...(orderNumber ? { order_number: orderNumber } : {}),
          ...(email ? { email } : {}),
        }
      }

      if (uploads.length && ['create_product_full', 'draft_article', 'publish_article'].includes(action.type)) {
        parameters = {
          ...parameters,
          __attachments: uploads.map((item) => ({
            name: item.name,
            url: item.url,
            type: item.type,
            storagePath: item.storagePath,
            size: item.size,
          })),
        }
      }

      const response = await fetch('/api/admin/assistant/actions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: action.type, parameters, sessionId: sessionIdRef.current }),
      })

      const text = await response.text()
      let json: any = null
      if (text) {
        try {
          json = JSON.parse(text)
        } catch (error) {
          console.error('Failed to parse assistant action response', error)
        }
      }

      if (!response.ok) {
        if (json?.sessionId) {
          sessionIdRef.current = json.sessionId
        }
        throw new Error(json?.error || `Failed to run action (${response.status})`)
      }

      if (json?.sessionId) {
        sessionIdRef.current = json.sessionId
      }

      message.success(json?.message || 'Action completed')
      setUploads([])
      setUploadFileList([])
      if (json?.message) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: json.message },
        ])
      }
      if (json?.undo?.token) {
        setUndoOptions((current) => [
          ...current.filter((item) => item.token !== json.undo.token),
          {
            token: json.undo.token,
            actionType: action.type,
            expiresAt: json.undo.expiresAt,
          },
        ])
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error'
      message.error(reason)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: reason,
        },
      ])
    } finally {
      setActionLoading(false)
      setPendingAction(null)
      actionForm.resetFields()
    }
  }

  async function handleUndo(option: UndoOption) {
    try {
      setUndoLoadingToken(option.token)
      const response = await fetch('/api/admin/assistant/actions/undo', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: option.token }),
      })
      const text = await response.text()
      let json: any = null
      if (text) {
        try {
          json = JSON.parse(text)
        } catch (_) {
          json = null
        }
      }
      if (!response.ok) {
        throw new Error(json?.error || `Undo failed (${response.status})`)
      }
      setUndoOptions((current) => current.filter((item) => item.token !== option.token))
      message.success(json?.message || 'Action undone')
      if (json?.message) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: json.message },
        ])
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Failed to undo action'
      message.error(reason)
    } finally {
      setUndoLoadingToken(null)
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
                    {item.actions.map((action) => {
                      const plan = buildActionPlan(action.type, action.parameters || {})
                      return (
                        <div key={`${action.type}-${action.summary}`} className="rounded-md border border-border bg-[#0f1624] p-3">
                          <Text strong>{action.summary}</Text>
                          <Divider style={{ margin: '8px 0' }} />
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {Object.entries(action.parameters || {})
                              .filter(([key]) => !key.startsWith('__'))
                              .map(([key, value]) => {
                                const definition = assistantActionMap[action.type]?.parameters.find((param) => param.name === key)
                              const label = definition?.label ?? key
                              return (
                                <div key={key} className="flex justify-between gap-2">
                                  <span className="uppercase tracking-wide">{label}</span>
                                  <span className="text-right break-all">{String(value)}</span>
                                </div>
                              )
                              })}
                          </div>
                          {plan ? (
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              <Text strong>Plan preview · Risk {plan.riskLevel}</Text>
                              <ol className="list-decimal list-inside space-y-1">
                                {plan.steps.map((step) => (
                                  <li key={step.title}>{step.detail}</li>
                                ))}
                              </ol>
                              {plan.riskNote ? (
                                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                  {plan.riskNote}
                                </Paragraph>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="mt-3 text-right">
                            <Button size="small" type="primary" onClick={() => setPendingAction(action)}>
                              Review & Run
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </List.Item>
          )}
        />
      </div>

      {undoOptions.length ? (
        <div className="space-y-2">
          {undoOptions.map((option) => {
            const definition = assistantActionMap[option.actionType]
            return (
              <Alert
                key={option.token}
                type="warning"
                showIcon
                closable
                onClose={() => setUndoOptions((current) => current.filter((item) => item.token !== option.token))}
                message={`Undo ${definition?.label ?? option.actionType}`}
                description={
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary">Expires around {formatExpiry(option.expiresAt)}.</Text>
                    <Button
                      size="small"
                      onClick={() => handleUndo(option)}
                      loading={undoLoadingToken === option.token}
                      type="primary"
                    >
                      Undo
                    </Button>
                  </Space>
                }
              />
            )
          })}
        </div>
      ) : null}

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
        <Collapse ghost style={{ marginBottom: 12 }}>
          <Panel header="Add structured context (optional)" key="context">
            <Form form={contextForm} layout="vertical" initialValues={{ publishImmediately: true, featureOnHero: false, articleWordCount: 400, articlePublish: false }}>
              <div className="grid gap-3 md:grid-cols-2">
                <Form.Item label="Product Title" name="productTitle">
                  <Input placeholder="Leave blank to let the assistant infer" autoComplete="off" />
                </Form.Item>
                <Form.Item label="Format" name="format">
                  <Input placeholder="Vinyl, Cassette, CD…" autoComplete="off" />
                </Form.Item>
                <Form.Item label="Target Price (AUD)" name="price">
                  <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="e.g. 42" />
                </Form.Item>
                <Form.Item label="Initial Stock" name="stock">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 200" />
                </Form.Item>
                <Form.Item label="Publish Product Immediately" name="publishImmediately" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item label="Feature on Hero" name="featureOnHero" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item label="Article Word Target" name="articleWordCount">
                  <InputNumber min={120} max={1200} style={{ width: '100%' }} placeholder="e.g. 400" />
                </Form.Item>
                <Form.Item label="Publish Article on Save" name="articlePublish" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </div>
              <Form.Item label="Preferred Article Tags (comma separated)" name="articleTags">
                <Input placeholder="black metal, release news" autoComplete="off" />
              </Form.Item>
            </Form>
            <Upload.Dragger
              name="assistant-upload"
              multiple
              fileList={uploadFileList}
              beforeUpload={() => false}
              onRemove={(file) => {
                removeAttachment(file)
                return false
              }}
              onChange={async ({ file }) => {
                if (file.status !== 'uploading' && file.originFileObj) {
                  await uploadToServer(file.originFileObj)
                }
              }}
              disabled={uploading}
              accept="image/*,audio/*"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Drag & drop media files or click to browse.</p>
              <p className="ant-upload-hint">Files upload immediately and will be attached to the next assistant action.</p>
            </Upload.Dragger>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="small" onClick={() => { contextForm.resetFields(); setUploads([]); setUploadFileList([]) }}>Reset context</Button>
            </div>
          </Panel>
        </Collapse>
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
            {(() => {
              const plan = buildActionPlan(pendingAction.type, pendingAction.parameters || {})
              if (!plan) return null
              return (
                <div className="space-y-1">
                  <Text type="secondary">Plan ({plan.steps.length} steps, risk {plan.riskLevel})</Text>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                    {plan.steps.map((step) => (
                      <li key={step.title}>{step.detail}</li>
                    ))}
                  </ol>
                  {plan.riskNote ? (
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {plan.riskNote}
                    </Paragraph>
                  ) : null}
                </div>
              )
            })()}
            <div className="space-y-2">
              {pendingAction.type === 'receive_stock' ? (
                <Form form={actionForm} layout="vertical" requiredMark={false}>
                  <Form.Item
                    label="Variant ID"
                    name="variant_id"
                    rules={[{ required: true, message: 'Variant ID is required' }]}
                  >
                    <Input placeholder="UUID of the variant" />
                  </Form.Item>
                  <Form.Item
                    label="Quantity"
                    name="quantity"
                    rules={[
                      { required: true, message: 'Quantity is required' },
                      { type: 'number', min: 1, message: 'Quantity must be at least 1' },
                    ]}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea rows={3} placeholder="Optional receiving note" />
                  </Form.Item>
                </Form>
              ) : pendingAction.type === 'lookup_order_status' ? (
                <Form form={actionForm} layout="vertical" requiredMark={false}>
                  <Form.Item label="Order Number" name="order_number">
                    <Input placeholder="e.g. ORR-123456" autoComplete="off" />
                  </Form.Item>
                  <Form.Item label="Customer Email" name="email">
                    <Input type="email" placeholder="email@example.com" autoComplete="off" />
                  </Form.Item>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    Provide an order number or email (both allowed). We’ll use the most specific value available.
                  </Paragraph>
                </Form>
              ) : (
                <div className="space-y-1">
                  {Object.entries(pendingAction.parameters || {}).map(([key, value]) => {
                    const definition = assistantActionMap[pendingAction.type]?.parameters.find((param) => param.name === key)
                    const label = definition?.label ?? key
                    const displayValue = String(value ?? '').trim() || '—'
                    return (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="uppercase tracking-wide text-xs text-muted-foreground">{label}</span>
                        <span className="text-right break-all text-sm">{displayValue}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {pendingAction.type === 'create_product_draft' && (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                The copilot will create a draft product with these details and leave it inactive so you can review before publishing.
              </Paragraph>
            )}
            {pendingAction.type === 'receive_stock' && (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Inventory updates are audit logged. Double-check the variant ID and quantity before running.
              </Paragraph>
            )}
            {pendingAction.type === 'lookup_order_status' && (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Order lookups use service credentials and are logged in the audit trail.
              </Paragraph>
            )}
          </div>
        )}
      </Modal>
    </Drawer>
  )
}
