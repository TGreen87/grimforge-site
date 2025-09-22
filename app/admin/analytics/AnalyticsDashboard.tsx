'use client'

import { useMemo } from 'react'
import { Card, Col, Empty, Row, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

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

interface DailyRollup {
  event_day: string
  event_type: string
  event_count: number
}

interface AnalyticsDashboardProps {
  initialEvents: AnalyticsEvent[]
  initialDaily: DailyRollup[]
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function AnalyticsDashboard({ initialEvents, initialDaily }: AnalyticsDashboardProps) {
  const metrics = useMemo(() => {
    const sessionIds = new Set<string>()
    const pageViewsByPath = new Map<string, number>()
    const referrers = new Map<string, number>()

    for (const event of initialEvents) {
      if (event.session_id) sessionIds.add(event.session_id)
      if (event.event_type === 'page_view') {
        pageViewsByPath.set(event.pathname, (pageViewsByPath.get(event.pathname) ?? 0) + 1)
      }
      if (event.referrer) {
        const key = event.referrer.replace(/^https?:\/\//, '')
        referrers.set(key, (referrers.get(key) ?? 0) + 1)
      }
    }

    const totalEvents7d = initialDaily.reduce((acc, item) => acc + item.event_count, 0)
    const pageViews7d = initialDaily
      .filter((item) => item.event_type === 'page_view')
      .reduce((acc, item) => acc + item.event_count, 0)

    const topPages = Array.from(pageViewsByPath.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const topReferrers = Array.from(referrers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      totalEvents7d,
      pageViews7d,
      uniqueSessions: sessionIds.size,
      topPages,
      topReferrers,
    }
  }, [initialEvents, initialDaily])

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

  return (
    <div className="space-y-6">
      <Title level={3} style={{ margin: 0 }}>Analytics Overview</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#0f172a' }}>
            <Statistic title="Events (7d)" value={metrics.totalEvents7d} valueStyle={{ color: '#38bdf8' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#0f172a' }}>
            <Statistic title="Page Views (7d)" value={metrics.pageViews7d} valueStyle={{ color: '#22d3ee' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#0f172a' }}>
            <Statistic title="Unique Sessions" value={metrics.uniqueSessions} valueStyle={{ color: '#a855f7' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Top Pages" bordered={false} bodyStyle={{ minHeight: 180 }}>
            {metrics.topPages.length ? (
              <ul className="space-y-2">
                {metrics.topPages.map(([path, count]) => (
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
            {metrics.topReferrers.length ? (
              <ul className="space-y-2">
                {metrics.topReferrers.map(([ref, count]) => (
                  <li key={ref} className="flex items-center justify-between text-sm">
                    <Text>{ref}</Text>
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
          dataSource={initialEvents}
          pagination={{ pageSize: 25, showSizeChanger: false }}
          size="small"
          scroll={{ x: true }}
        />
      </Card>
    </div>
  )
}
