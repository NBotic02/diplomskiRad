import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Card, Col, Row, Statistic, Empty, Spin, Space, List, Typography,
} from 'antd';
import {
  RiseOutlined, FallOutlined, AlertOutlined, ClockCircleOutlined,
} from '@ant-design/icons';

import { casesApi } from '@/api/cases';
import { metricsApi, bottlenecksApi } from '@/api/analytics';
import { StatusTag } from '@/components/StatusTag';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { fmtRelative, shortId } from '@/lib/format';

const { Text, Title } = Typography;

const REFRESH_MS = 30_000;

export function Dashboard() {
  const me = useCurrentUser();
  const canSeeBottlenecks = me.canSeeTeam;

  const dailyQ       = useQuery({ queryKey: ['metrics', 'daily'],
                                  queryFn: () => metricsApi.daily(),
                                  refetchInterval: REFRESH_MS,
                                  enabled: me.canSeeTeam });
  const personalQ    = useQuery({ queryKey: ['metrics', 'agentToday', me.agentId],
                                  queryFn: () => metricsApi.agentToday(me.agentId!),
                                  refetchInterval: REFRESH_MS,
                                  enabled: me.isAgent && !!me.agentId });
  const bottlenecksQ = useQuery({ queryKey: ['bottlenecks'],
                                  queryFn: () => bottlenecksApi.list(true),
                                  refetchInterval: REFRESH_MS,
                                  enabled: canSeeBottlenecks });
  const recentQ      = useQuery({ queryKey: ['cases', 'recent'],
                                  queryFn: () => casesApi.list({ size: 8 }),
                                  refetchInterval: REFRESH_MS });
  const todayQ       = useQuery({ queryKey: ['cases', 'today'],
                                  queryFn: () => casesApi.list({ size: 200 }),
                                  refetchInterval: REFRESH_MS });

  const liveToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const cases = todayQ.data?.content ?? [];
    const todays = cases.filter(c => c.createdAt && new Date(c.createdAt) >= startOfDay);
    return {
      created:    todays.length,
      resolved:   todays.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
      escalated:  todays.filter(c => c.status === 'ESCALATED').length,
      reopened:   todays.filter(c => c.status === 'REOPENED').length,
      autoResolved: todays.filter(c => c.status === 'RESOLVED' && !c.assignedAgentId).length,
    };
  }, [todayQ.data]);

  if ((me.canSeeTeam && dailyQ.isLoading) || (canSeeBottlenecks && bottlenecksQ.isLoading) || recentQ.isLoading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: 320 }}><Spin /></div>;
  }

  const today = dailyQ.data?.find(m => m.metricDate === new Date().toISOString().slice(0, 10))
              ?? dailyQ.data?.[dailyQ.data.length - 1]
              ?? null;

  return (
    <div style={{ padding: '24px' }}>
      <div className="page-head" style={{ padding: 0, marginBottom: 16 }}>
        <span className="eyebrow">Today</span>
        <Title level={1} style={{ marginTop: 4, marginBottom: 0 }}>Operations overview</Title>
      </div>

      <Card styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
        <Row>
          <Col flex="1" style={{ borderInlineEnd: '1px solid #f4f4f5', padding: 20 }}>
            <Statistic
              title="Created today"
              value={liveToday.created}
              valueStyle={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Resolved {liveToday.resolved}
            </Text>
          </Col>
          <Col flex="1" style={{ borderInlineEnd: '1px solid #f4f4f5', padding: 20 }}>
            <Statistic
              title="Resolved"
              value={liveToday.resolved}
              valueStyle={{ color: '#059669', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
              prefix={<RiseOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Auto-resolved {liveToday.autoResolved}
            </Text>
          </Col>
          <Col flex="1" style={{ borderInlineEnd: '1px solid #f4f4f5', padding: 20 }}>
            <Statistic
              title="Escalated"
              value={liveToday.escalated}
              valueStyle={{ color: '#d97706', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
              prefix={<AlertOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Reopened {liveToday.reopened}
            </Text>
          </Col>
          {(me.canSeeTeam || me.isAgent) && (
            <Col flex="1" style={{ borderInlineEnd: '1px solid #f4f4f5', padding: 20 }}>
              <Statistic
                title={me.canSeeTeam ? 'SLA compliance' : 'My SLA compliance'}
                value={
                  (me.canSeeTeam
                    ? today?.slaComplianceRate
                    : personalQ.data?.slaComplianceRate) ?? 0
                }
                precision={1}
                suffix="%"
                valueStyle={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {me.canSeeTeam
                  ? (today?.avgResolutionMinutes
                      ? <>Avg resolution {today.avgResolutionMinutes} min</>
                      : 'Awaiting first resolutions')
                  : (personalQ.data?.avgResolutionMinutes
                      ? <>Avg resolution {personalQ.data.avgResolutionMinutes} min</>
                      : 'Awaiting first resolutions')}
              </Text>
            </Col>
          )}
          {(me.canSeeTeam || me.isAgent) && (
            <Col flex="1" style={{ padding: 20 }}>
              <Statistic
                title={me.canSeeTeam ? 'CSAT' : 'My CSAT'}
                value={
                  (me.canSeeTeam
                    ? today?.customerSatisfactionAvg
                    : personalQ.data?.customerSatisfactionAvg) ?? 0
                }
                precision={2}
                suffix="/ 5"
                valueStyle={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>1–5 star average</Text>
            </Col>
          )}
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={canSeeBottlenecks ? 16 : 24}>
          <Card
            title="Recent cases"
            extra={<Link to="/cases" style={{ fontSize: 12, color: '#71717a' }}>View all →</Link>}
            styles={{ body: { padding: 0 } }}
          >
            {recentQ.data?.content.length ? (
              <List
                dataSource={recentQ.data.content}
                renderItem={c => (
                  <List.Item style={{ padding: '12px 16px' }}>
                    <Link to={`/cases/${c.caseId}`}
                          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 16, color: 'inherit' }}>
                      <span className="mono" style={{ width: 64, fontSize: 12, color: '#71717a' }}>
                        #{c.caseNumber ?? '—'}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#18181b',
                                     overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.subject}
                      </span>
                      <StatusTag variant="priority" value={c.priority} />
                      <StatusTag variant="status"   value={c.status} />
                      <span className="mono" style={{ width: 96, textAlign: 'right',
                                                       fontSize: 11, color: '#71717a' }}>
                        {fmtRelative(c.createdAt)}
                      </span>
                    </Link>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="No cases yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>
        </Col>

        {canSeeBottlenecks && (
        <Col xs={24} lg={8}>
          <Card
            title="Active bottlenecks"
            extra={<Link to="/statistics" style={{ fontSize: 12, color: '#71717a' }}>All →</Link>}
            styles={{ body: { padding: 0 } }}
          >
            {bottlenecksQ.data?.length ? (
              <List
                dataSource={bottlenecksQ.data}
                renderItem={b => (
                  <List.Item style={{ padding: '12px 16px', display: 'block' }}>
                    <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 12 }}>
                        {b.bottleneckType.replace(/_/g, ' ')}
                      </Text>
                      <StatusTag variant="severity" value={b.severity} />
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      {b.description}
                    </Text>
                    <Text className="mono" style={{ fontSize: 11, color: '#a1a1aa' }}>
                      <ClockCircleOutlined /> {fmtRelative(b.detectedAt)} · id {shortId(b.id)}
                    </Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="All clear"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>
        </Col>
        )}
      </Row>
    </div>
  );
}

void FallOutlined;
