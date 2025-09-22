'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Divider, Empty, Row, Segmented, Select, Space, Spin, Statistic, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

type RangeKey = '24h' | '7d' | '30d'

interface AnalyticsEvent {
  id: string
  event_type: string
  pathname: string
  search: string | null
  referrer: string | null
  session_id: string | null
  metadata: Record<string, unknown> | null
  user_agent: string | null
  ip_address: string | null
  occurred_at: string
}

interface AnalyticsSummary {
  range: string
  since: string
  totalEvents: number
  pageViews: number
  uniqueSessions: number
  internalEvents: number
  externalEvents: number
  topPages: Array<{ path: string; count: number }>
  topReferrers: Array<{ referrer: string; count: number }>
  events: AnalyticsEvent[]
}

interface AnalyticsResponse {
  ok: boolean
  summary: AnalyticsSummary
}

interface AnalyticsDashboardProps {
  defaultRange: RangeKey
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function AnalyticsDashboard({ defaultRange }: AnalyticsDashboardProps) {
  const [range, setRange] = useState<RangeKey>(defaultRange)
  const [pathname, setPathname] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)

  const fetchAnalytics = async (opts?: { keepLoading?: boolean }) => {
    if (!opts?.keepLoading) setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ range })
      if (pathname) {
        params.set('pathname', pathname)
      }
      const response = await fetch(`/api/admin/analytics/overview?${params.toString()}`)
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json?.error || `Request failed with ${response.status}`)
      }
      const data = (await response.json()) as AnalyticsResponse
      setSummary(data.summary)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, pathname])

  const downloadCsv = async () => {
    try {
      const params = new URLSearchParams({ range, download: 'csv' })
      if (pathname) params.set('pathname', pathname)
      const response = await fetch(`/api/admin/analytics/overview?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to generate CSV')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${range}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed'
      setError(message)
    }
  }

  const pathOptions = useMemo(() => {
    if (!summary?.events?.length) return []
    const uniquePaths = new Set(summary.events.map((event) => event.pathname))
    return Array.from(uniquePaths).sort()
  }, [summary?.events])

  const columns: ColumnsType<AnalyticsEvent> = [
    {
      title: 'When',
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      render: (value: string) => <Text>{formatDate(value)}</Text>,
      width: 200,
    },
    {
      title: 'Event',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 140,
      render: (value: string) => <Tag color={value === 'page_view' ? 'blue' : 'gold'}>{value}</Tag>,
    },
    {
      title: 'Path',
      dataIndex: 'pathname',
      key: 'pathname',
      ellipsis: true,
    },
    {
      title: 'Session',
      dataIndex: 'session_id',
      key: 'session_id',
      ellipsis: true,
      render: (value: string | null) => value ? <Text code>{value.slice(0, 8)}</Text> : <Text type="secondary">—</Text>,
      width: 120,
    },
    {
      title: 'Referrer',
      dataIndex: 'referrer',
      key: 'referrer',
      ellipsis: true,
      render: (value: string | null) => value ? <Text>{value}</Text> : <Text type="secondary">Direct</Text>,
    },
  ]

  const metrics = summary ? {
    totalEvents: summary.totalEvents,
    pageViews: summary.pageViews,
    uniqueSessions: summary.uniqueSessions,
    internalEvents: summary.internalEvents,
    externalEvents: summary.externalEvents,
  } : {
    totalEvents: 0,
    pageViews: 0,
    uniqueSessions: 0,
    internalEvents: 0,
    externalEvents: 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Title level={3} style={{ margin: 0 }}>Analytics Overview</Title>
        <Space wrap>
          <Segmented
            value={range}
            onChange={(value) => setRange(value as RangeKey)}
            options={[
              { label: '24 hours', value: '24h' },
              { label: '7 days', value: '7d' },
              { label: '30 days', value: '30d' },
            ]}
          />
          <Select
            allowClear
            placeholder="Filter by path"
            showSearch
            value={pathname || undefined}
            onChange={(value) => setPathname(value ?? '')}
            style={{ minWidth: 220 }}
            options={pathOptions.map((path) => ({ label: path, value: path }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchAnalytics({ keepLoading: true })} />
          <Button icon={<DownloadOutlined />} onClick={downloadCsv}>Export CSV</Button>
        </Space>
      </div>

      {loading && (
        <div className="flex h-32 items-center justify-center"><Spin /></div>
      )}

      {!loading && error && (
        <Card bordered={false} style={{ background: '#2b1818' }}>
          <Text type="danger">{error}</Text>
        </Card>
      )}

      {!loading && summary && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Card bordered={false} style={{ background: '#0f172a' }}>
                <Statistic title="Events" value={metrics.totalEvents} valueStyle={{ color: '#38bdf8' }} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card bordered={false} style={{ background: '#0f172a' }}>
                <Statistic title="Page Views" value={metrics.pageViews} valueStyle={{ color: '#22d3ee' }} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card bordered={false} style={{ background: '#0f172a' }}>
                <Statistic title="Unique Sessions" value={metrics.uniqueSessions} valueStyle={{ color: '#a855f7' }} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card bordered={false} style={{ background: '#0f172a' }}>
                <Statistic title="Internal Hits" value={metrics.internalEvents} valueStyle={{ color: '#f97316' }} />
                <Divider style={{ margin: '12px 0' }} />
                <Statistic title="Public Hits" value={metrics.externalEvents} valueStyle={{ color: '#4ade80' }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Top Pages" bordered={false} bodyStyle={{ minHeight: 180 }}>
                {summary.topPages.length ? (
                  <ul className="space-y-2">
                    {summary.topPages.map(({ path, count }) => (
                      <li key={path} className="flex items-center justify-between text-sm">
                        <Text>{path}</Text>
                        <Tag color="geekblue">{count}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty description="No data yet" />
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Top Referrers" bordered={false} bodyStyle={{ minHeight: 180 }}>
                {summary.topReferrers.length ? (
                  <ul className="space-y-2">
                    {summary.topReferrers.map(({ referrer, count }) => (
                      <li key={referrer} className="flex items-center justify-between text-sm">
                        <Text>{referrer}</Text>
                        <Tag color="purple">{count}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty description="No referrers yet" />
                )}
              </Card>
            </Col>
          </Row>

          <Card title="Recent Events" bordered={false}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={summary.events}
              pagination={{ pageSize: 25, showSizeChanger: false }}
              size="small"
              scroll={{ x: true }}
            />
          </Card>
        </>
      )}
    </div>
  )
}
