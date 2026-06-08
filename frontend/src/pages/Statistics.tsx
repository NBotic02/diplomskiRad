import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App, Badge, Button, Card, Col, Empty, Row, Segmented, Select, Space, Spin,
  Statistic, Tabs, Tag, Tooltip as AntTooltip, Typography,
} from 'antd';
import {
  ArrowDownOutlined, ArrowUpOutlined,
  ClockCircleOutlined, RiseOutlined, ThunderboltOutlined,
  CheckCircleOutlined, RobotOutlined, AlertOutlined,
  FireOutlined, HourglassOutlined, UserOutlined, CheckOutlined,
} from '@ant-design/icons';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line,
  LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { bottlenecksApi, metricsApi } from '@/api/analytics';
import { caseBreakdownApi } from '@/api/cases';
import { agentsApi, departmentsApi } from '@/api/employees';
import { StatusTag } from '@/components/StatusTag';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { fmtRelative } from '@/lib/format';
import type {
  AgentPerformance, Bottleneck, BottleneckType, DailyMetric, Severity,
} from '@/types/api';

const { Title, Text } = Typography;

type RangeKey = '7' | '30' | '90';

const RANGE_DAYS: Record<RangeKey, number> = { '7': 7, '30': 30, '90': 90 };

const CATEGORY_COLORS = ['#0ea5e9', '#d97706', '#10b981', '#a855f7', '#ef4444', '#71717a', '#eab308', '#06b6d4'];
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH:     '#ea580c',
  MEDIUM:   '#a1a1aa',
  LOW:      '#d4d4d8',
};

export function Statistics() {
  const me = useCurrentUser();
  const [range, setRange] = useState<RangeKey>('30');
  const [pickedAgent, setPickedAgent] = useState<string | undefined>();
  const [pickedDept, setPickedDeptState] = useState<string | undefined>();
  const setPickedDept = (d: string | undefined) => {
    setPickedDeptState(d);
    setPickedAgent(undefined);
  };
  const agentId: string | undefined = me.isAgent
      ? me.agentId
      : pickedAgent;
  const setAgentId = setPickedAgent;

  const days = RANGE_DAYS[range];
  const dailyQ = useQuery({
    queryKey: ['metrics', 'daily', range],
    queryFn:  () => metricsApi.daily(rangeFrom(days * 2), todayIso()),
    enabled:  !agentId,
  });
  const agentHistoryQ = useQuery({
    queryKey: ['metrics', 'agent', agentId],
    queryFn:  () => metricsApi.agentHistory(agentId!, 'DAILY'),
    enabled:  !!agentId,
  });
  const departmentsQ = useQuery({
    queryKey: ['departments'],
    queryFn:  () => departmentsApi.list(),
    enabled:  me.isAdmin,
  });
  const agentsQ = useQuery({
    queryKey: ['agents', { departmentId: pickedDept }],
    queryFn:  () => agentsApi.list(pickedDept),
    enabled:  me.canSeeTeam,
  });
  const bottlenecksQ = useQuery({
    queryKey: ['bottlenecks', 'all'],
    queryFn:  () => bottlenecksApi.list(false),
    enabled:  me.canSeeTeam,
  });

  const breakdownAgentIds: string[] | undefined = useMemo(() => {
    if (agentId)    return [agentId];
    if (pickedDept) return (agentsQ.data ?? []).map(a => a.agentId);
    return undefined;
  }, [agentId, pickedDept, agentsQ.data]);
  const breakdownQ = useQuery({
    queryKey: ['cases', 'breakdown', range, breakdownAgentIds],
    queryFn:  () => caseBreakdownApi.fetch(
      rangeFrom(days),
      todayIso(),
      breakdownAgentIds,
    ),
  });

  const deptAgentIds = pickedDept ? (agentsQ.data ?? []).map(a => a.agentId) : [];
  const deptHistoriesQ = useQueries({
    queries: deptAgentIds.map(id => ({
      queryKey: ['metrics', 'agent', id],
      queryFn:  () => metricsApi.agentHistory(id, 'DAILY'),
      enabled:  !!pickedDept && !agentId,
    })),
  });
  const deptHistoriesData = deptHistoriesQ.map(q => q.data).filter(Boolean) as AgentPerformance[][];

  const departmentDaily = useMemo<DailyMetric[]>(() => {
    if (!pickedDept || agentId) return [];
    const byDate = new Map<string, AgentPerformance[]>();
    for (const list of deptHistoriesData) {
      for (const row of list) {
        const arr = byDate.get(row.periodStart) ?? [];
        arr.push(row);
        byDate.set(row.periodStart, arr);
      }
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rows]) => ({
        metricDate: date,
        totalCreated:   rows.reduce((s, r) => s + r.casesAssigned,  0),
        totalResolved:  rows.reduce((s, r) => s + r.casesResolved,  0),
        totalEscalated: rows.reduce((s, r) => s + r.casesEscalated, 0),
        totalReopened: 0,
        autoResolved:  0,
        avgFirstResponseMinutes: weightedAvg(rows, r => r.avgFirstResponseMinutes, r => r.casesAssigned),
        avgResolutionMinutes:    weightedAvg(rows, r => r.avgResolutionMinutes,    r => r.casesResolved),
        slaComplianceRate:       weightedAvg(rows, r => r.slaComplianceRate,       r => r.casesAssigned),
        customerSatisfactionAvg: weightedAvg(rows, r => r.customerSatisfactionAvg, r => r.casesResolved),
        casesByPriority: {},
        casesByCategory: {},
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedDept, agentId, deptHistoriesData.map(d => d.length).join(',')]);

  const effectiveDaily = useMemo<DailyMetric[]>(() => {
    if (agentId)    return (agentHistoryQ.data ?? []).map(a => agentToDaily(a));
    if (pickedDept) return departmentDaily;
    return dailyQ.data ?? [];
  }, [agentId, pickedDept, dailyQ.data, agentHistoryQ.data, departmentDaily]);

  const split = useMemo(() => splitWindow(effectiveDaily, days), [effectiveDaily, days]);

  const current  = useMemo(() => aggregate(split.current),  [split.current]);
  const previous = useMemo(() => aggregate(split.previous), [split.previous]);

  const series = useMemo(() => split.current.map(m => ({
    date:      shortDate(m.metricDate),
    Created:   m.totalCreated,
    Resolved:  m.totalResolved,
    Escalated: m.totalEscalated,
  })), [split.current]);

  const speedSeries = useMemo(() => split.current.map(m => ({
    date:        shortDate(m.metricDate),
    'First response (min)': m.avgFirstResponseMinutes ?? 0,
    'Resolution (min)':     m.avgResolutionMinutes ?? 0,
    'SLA compliance (%)':   m.slaComplianceRate    ?? 0,
  })), [split.current]);

  const categoryMix = useMemo(() => {
    const totals = breakdownQ.data?.casesByCategory ?? {};
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [breakdownQ.data]);

  const priorityMix = useMemo(() => {
    const totals = breakdownQ.data?.casesByPriority ?? {};
    return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
      .filter(p => totals[p])
      .map(name => ({ name, value: totals[name] }));
  }, [breakdownQ.data]);

  const autoResolveSeries = useMemo(() => {
    if (current.resolved === 0) return [];
    return [
      { name: 'Auto-resolved', value: current.autoResolved,                    color: '#0ea5e9' },
      { name: 'Agent-resolved', value: Math.max(0, current.resolved - current.autoResolved), color: '#27272a' },
    ];
  }, [current.resolved, current.autoResolved]);

  const activeBottlenecks   = (bottlenecksQ.data ?? []).filter(b => !b.isResolved);
  const resolvedBottlenecks = (bottlenecksQ.data ?? []).filter(b => b.isResolved);

  const isLoading = agentId
      ? agentHistoryQ.isLoading
      : pickedDept
        ? deptHistoriesQ.some(q => q.isLoading)
        : (dailyQ.isLoading || bottlenecksQ.isLoading);
  if (isLoading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: 320 }}><Spin /></div>;
  }

  const resolutionRate = pct(current.resolved, current.created);
  const prevResolutionRate = pct(previous.resolved, previous.created);

  return (
    <div style={{ padding: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 20, gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <span className="eyebrow">
            Last {days} days
            {pickedDept && ` · ${departmentLabel(departmentsQ.data, pickedDept)}`}
            {agentId   && ` · ${agentLabel(agentsQ.data, agentId)}`}
          </span>
          <Title level={1} style={{ marginTop: 4, marginBottom: 0 }}>Statistics</Title>
        </div>
        <Space size={12} wrap>
          {me.isAdmin && (
            <Select<string | undefined>
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="All departments"
              value={pickedDept}
              onChange={setPickedDept}
              style={{ minWidth: 200 }}
              options={[
                { value: undefined as unknown as string, label: 'All departments' },
                ...((departmentsQ.data ?? []).map(d => ({
                  value: d.departmentId,
                  label: d.name,
                }))),
              ]}
            />
          )}
          {me.canSeeTeam && (
            <Select<string | undefined>
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="All agents"
              value={agentId}
              onChange={setAgentId}
              style={{ minWidth: 220 }}
              options={[
                {
                  value: undefined as unknown as string,
                  label: pickedDept ? 'All agents in department' : 'All agents (team-wide)',
                },
                ...((agentsQ.data ?? []).map(a => ({
                  value: a.agentId,
                  label: `${a.firstName} ${a.lastName} · ${a.role}`,
                }))),
              ]}
            />
          )}
          <Segmented<RangeKey>
            value={range}
            onChange={v => setRange(v as RangeKey)}
            options={[
              { label: '7 days',  value: '7' },
              { label: '30 days', value: '30' },
              { label: '90 days', value: '90' },
            ]}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <KpiCard
          icon={<CheckCircleOutlined />}
          title="Resolution rate"
          value={resolutionRate}
          suffix="%"
          delta={delta(resolutionRate, prevResolutionRate)}
          color="#059669"
          format="percent"
        />
        <KpiCard
          icon={<ClockCircleOutlined />}
          title="First response"
          value={current.avgFirstResponse}
          suffix="min"
          delta={delta(current.avgFirstResponse, previous.avgFirstResponse)}
          inverted
          color="#0ea5e9"
          format="number"
        />
        <KpiCard
          icon={<RiseOutlined />}
          title="Resolution time"
          value={current.avgResolution}
          suffix="min"
          delta={delta(current.avgResolution, previous.avgResolution)}
          inverted
          color="#a855f7"
          format="number"
        />
        <KpiCard
          icon={<ThunderboltOutlined />}
          title="SLA compliance"
          value={current.slaCompliance}
          suffix="%"
          delta={delta(current.slaCompliance, previous.slaCompliance)}
          color="#d97706"
          format="percent"
        />
        <KpiCard
          icon={<RobotOutlined />}
          title="CSAT"
          value={current.csat}
          suffix="/ 5"
          delta={delta(current.csat, previous.csat)}
          color="#18181b"
          format="number"
          precision={2}
        />
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={(agentId || pickedDept) ? 24 : 16}>
          <Card title={<Space><RiseOutlined /> Volume — daily</Space>}
                extra={<Text type="secondary" style={{ fontSize: 11 }}>
                  {(agentId || pickedDept) ? 'assigned · resolved · escalated' : 'created · resolved · escalated'}
                </Text>}>
            {series.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#18181b" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#18181b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gEscalated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Created"   stroke="#18181b" fill="url(#gCreated)"   strokeWidth={2} />
                  <Area type="monotone" dataKey="Resolved"  stroke="#059669" fill="url(#gResolved)"  strokeWidth={2} />
                  <Area type="monotone" dataKey="Escalated" stroke="#d97706" fill="url(#gEscalated)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />}
          </Card>
        </Col>

        {!agentId && !pickedDept && (
        <Col xs={24} lg={8}>
          <Card title={<Space><RobotOutlined /> Auto-resolve mix</Space>}>
            {autoResolveSeries.length ? (
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={autoResolveSeries}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {autoResolveSeries.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                  paddingBottom: 24,
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#0ea5e9',
                                lineHeight: 1.1,
                                fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
                    {pct(current.autoResolved, Math.max(1, current.resolved))}%
                  </div>
                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                    handled by AI
                  </div>
                </div>
              </div>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing resolved yet" />}
          </Card>
        </Col>
        )}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<Space><ClockCircleOutlined /> Speed &amp; SLA</Space>}
                extra={<Text type="secondary" style={{ fontSize: 11 }}>response · resolution · SLA</Text>}>
            {speedSeries.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={speedSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis yAxisId="left"  stroke="#71717a" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={11}
                         domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left"  type="monotone" dataKey="First response (min)" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} />
                  <Line yAxisId="left"  type="monotone" dataKey="Resolution (min)"     stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} />
                  <Line yAxisId="right" type="monotone" dataKey="SLA compliance (%)"   stroke="#d97706" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />}
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Categories">
            {categoryMix.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryMix} dataKey="value" cx="50%" cy="50%"
                       outerRadius={90} label={({ name }) => name} fontSize={10}>
                    {categoryMix.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />}
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Priority mix">
            {priorityMix.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priorityMix} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityMix.map((d, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[d.name] ?? '#27272a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />}
          </Card>
        </Col>
      </Row>

      {me.canSeeTeam && (
      <Card title={<Space size={8}><AlertOutlined /> Bottlenecks</Space>}
            styles={{ body: { padding: 0 } }}>
        <Tabs
          tabBarStyle={{ paddingInline: 20, marginBottom: 0 }}
          items={[
            {
              key: 'active',
              label: (
                <Space size={8}>
                  <span>Active</span>
                  <Badge
                    count={activeBottlenecks.length}
                    showZero
                    color={activeBottlenecks.length ? '#dc2626' : '#a1a1aa'}
                    style={{ boxShadow: 'none' }}
                  />
                </Space>
              ),
              children: <BottleneckList items={activeBottlenecks} emptyMessage="All clear — no active bottlenecks" />,
            },
            {
              key: 'resolved',
              label: (
                <Space size={8}>
                  <span>Resolved</span>
                  <Badge
                    count={resolvedBottlenecks.length}
                    showZero
                    color="#a1a1aa"
                    style={{ boxShadow: 'none' }}
                  />
                </Space>
              ),
              children: <BottleneckList items={resolvedBottlenecks} emptyMessage="No resolved bottlenecks yet" />,
            },
          ]}
        />
      </Card>
      )}
    </div>
  );
}

/** Weighted average across rows, ignoring null values. */
function weightedAvg<T>(
  rows: T[],
  valueFn:  (r: T) => number | null,
  weightFn: (r: T) => number,
): number | null {
  let sum = 0;
  let weight = 0;
  for (const r of rows) {
    const v = valueFn(r);
    const w = weightFn(r);
    if (v == null || w <= 0) continue;
    sum += v * w;
    weight += w;
  }
  if (weight === 0) return null;
  return sum / weight;
}

/** Adapts an AgentPerformance row to the DailyMetric shape. */
function agentToDaily(a: AgentPerformance): DailyMetric {
  return {
    metricDate: a.periodStart,
    totalCreated:  a.casesAssigned,
    totalResolved: a.casesResolved,
    totalEscalated: a.casesEscalated,
    totalReopened: 0,
    autoResolved:  0,
    avgFirstResponseMinutes: a.avgFirstResponseMinutes,
    avgResolutionMinutes:    a.avgResolutionMinutes,
    slaComplianceRate:       a.slaComplianceRate,
    customerSatisfactionAvg: a.customerSatisfactionAvg,
    casesByPriority: {},
    casesByCategory: {},
  };
}

function agentLabel(agents: { agentId: string; firstName: string; lastName: string }[] | undefined,
                    agentId: string): string {
  const a = agents?.find(x => x.agentId === agentId);
  return a ? `${a.firstName} ${a.lastName}` : 'Selected agent';
}

function departmentLabel(departments: { departmentId: string; name: string }[] | undefined,
                         departmentId: string): string {
  const d = departments?.find(x => x.departmentId === departmentId);
  return d ? d.name : 'Selected department';
}

interface KpiCardProps {
  icon:    React.ReactNode;
  title:   string;
  value:   number;
  suffix?: string;
  delta:   number;
  color:   string;
  /** When true, a smaller number is BETTER (response times, etc). */
  inverted?: boolean;
  format:  'percent' | 'number';
  precision?: number;
}

function KpiCard({ icon, title, value, suffix, delta, color, inverted, precision }: KpiCardProps) {
  const hasChange = isFinite(delta) && Math.abs(delta) >= 0.5;
  const positive = delta > 0;
  const deltaIsGood = inverted ? !positive : positive;
  const deltaColor = deltaIsGood ? '#059669' : '#dc2626';
  const DeltaIcon  = positive ? ArrowUpOutlined : ArrowDownOutlined;

  return (
    <Col xs={24} sm={12} md={8} lg={Math.floor(24 / 5)} flex="1 1 18%">
      <Card size="small" styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ color, fontSize: 14 }}>{icon}</span>
          <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.05em',
                                          textTransform: 'uppercase', fontWeight: 600 }}>
            {title}
          </Text>
        </div>
        <Statistic
          value={value}
          precision={precision ?? (suffix?.includes('%') ? 1 : 0)}
          suffix={<span style={{ fontSize: 13, color: '#71717a' }}>{suffix}</span>}
          valueStyle={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', color: '#18181b' }}
        />
        {hasChange && (
          <AntTooltip title={`${(positive ? '+' : '') + delta.toFixed(1)}% vs previous period`}>
            <Space size={4} style={{ fontSize: 11, color: deltaColor, fontWeight: 600 }}>
              <DeltaIcon />
              {(positive ? '+' : '')}{delta.toFixed(1)}%
              <Text type="secondary" style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>
                vs prev
              </Text>
            </Space>
          </AntTooltip>
        )}
      </Card>
    </Col>
  );
}

const BOTTLENECK_TYPE_META: Record<BottleneckType,
    { icon: React.ReactNode; color: string; bg: string; label: string; metricLabel: string }> = {
  HIGH_VOLUME:     { icon: <FireOutlined />,        color: '#dc2626', bg: '#fef2f2',
                     label: 'High volume',         metricLabel: 'cases / hour' },
  SLA_BREACH_RATE: { icon: <ClockCircleOutlined />, color: '#d97706', bg: '#fffbeb',
                     label: 'SLA breach rate',     metricLabel: '% breached' },
  SLOW_RESOLUTION: { icon: <HourglassOutlined />,   color: '#ea580c', bg: '#fff7ed',
                     label: 'Slow resolution',     metricLabel: 'avg minutes' },
  AGENT_OVERLOAD:  { icon: <UserOutlined />,        color: '#7c3aed', bg: '#f5f3ff',
                     label: 'Agent overload',      metricLabel: 'active cases' },
};

const BOTTLENECK_SEVERITY_COLOR: Record<Severity, string> = {
  LOW:      '#a1a1aa',
  MEDIUM:   '#d97706',
  HIGH:     '#ea580c',
  CRITICAL: '#dc2626',
};

function BottleneckList({ items, emptyMessage }: { items: Bottleneck[]; emptyMessage: string }) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const resolveMut = useMutation({
    mutationFn: (id: string) => bottlenecksApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bottlenecks'] });
      message.success('Bottleneck marked resolved');
    },
    onError: (e: Error) => message.error(e.message),
  });

  if (!items.length) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 12 }} />
        <div style={{ color: '#52525b', fontSize: 13, fontWeight: 500 }}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <Space direction="vertical" size={12}
           style={{ width: '100%', padding: '16px 20px 20px' }}>
      {items.map(b => (
        <BottleneckCard
          key={b.id}
          item={b}
          onResolve={() => resolveMut.mutate(b.id)}
          isResolving={resolveMut.isPending && resolveMut.variables === b.id}
        />
      ))}
    </Space>
  );
}

function BottleneckCard({ item, onResolve, isResolving }: {
  item: Bottleneck;
  onResolve: () => void;
  isResolving: boolean;
}) {
  const meta     = BOTTLENECK_TYPE_META[item.bottleneckType];
  const sevColor = BOTTLENECK_SEVERITY_COLOR[item.severity];

  const ratio          = item.thresholdValue > 0 ? item.metricValue / item.thresholdValue : 1;
  const fillPct        = Math.min(100, (ratio / 3) * 100);
  const thresholdMark  = (1 / 3) * 100;
  const ratioFmt       = ratio >= 10 ? `${ratio.toFixed(0)}×` : `${ratio.toFixed(1)}×`;

  return (
    <div style={{
      position: 'relative',
      background: '#ffffff',
      border:     '1px solid #e4e4e7',
      borderLeft: `4px solid ${sevColor}`,
      borderRadius: 8,
      padding: '14px 16px 12px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          display: 'grid', placeItems: 'center',
          background: meta.bg, color: meta.color, fontSize: 16,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={8} align="center" style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#18181b' }}>{meta.label}</span>
            <StatusTag variant="severity" value={item.severity} />
            {item.isResolved && (
              <Tag color="green" bordered={false} style={{ margin: 0, fontSize: 10 }}>resolved</Tag>
            )}
          </Space>
          <div style={{ fontSize: 11, color: '#a1a1aa' }}>
            <ClockCircleOutlined style={{ marginInlineEnd: 4 }} />
            detected {fmtRelative(item.detectedAt)}
          </div>
        </div>
        {!item.isResolved && (
          <Button size="small" icon={<CheckOutlined />}
                  loading={isResolving} onClick={onResolve}>
            Resolve
          </Button>
        )}
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.55, color: '#3f3f46', marginBottom: 12 }}>
        {item.description}
      </div>

      <div style={{
        background: '#fafafa', border: '1px solid #f4f4f5',
        borderRadius: 6, padding: '10px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: '#71717a',
                        textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {meta.metricLabel}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: sevColor,
                        fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
            {ratioFmt} threshold
          </div>
        </div>

        <div style={{ position: 'relative', height: 6, background: '#e4e4e7', borderRadius: 3,
                      marginBottom: 6 }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${fillPct}%`, background: sevColor, borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
          <AntTooltip title={`Threshold: ${fmtMetric(item.thresholdValue)}`}>
            <div style={{
              position: 'absolute', top: -3, bottom: -3, left: `${thresholdMark}%`,
              width: 2, background: '#71717a', cursor: 'help',
            }} />
          </AntTooltip>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      fontSize: 11 }}>
          <span style={{ color: '#71717a' }}>
            actual{' '}
            <strong className="mono" style={{ color: '#18181b', fontSize: 13 }}>
              {fmtMetric(item.metricValue)}
            </strong>
          </span>
          <span style={{ color: '#71717a' }}>
            threshold{' '}
            <strong className="mono" style={{ color: '#52525b', fontSize: 12 }}>
              {fmtMetric(item.thresholdValue)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function fmtMetric(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

const tooltipStyle = {
  borderRadius: 6,
  border: '1px solid #e4e4e7',
  fontSize: 12,
  background: '#ffffff',
};

interface PeriodTotals {
  created:           number;
  resolved:          number;
  autoResolved:      number;
  escalated:         number;
  reopened:          number;
  avgFirstResponse:  number;
  avgResolution:     number;
  slaCompliance:     number;
  csat:              number;
}

function aggregate(rows: DailyMetric[]): PeriodTotals {
  const acc = { created: 0, resolved: 0, autoResolved: 0, escalated: 0, reopened: 0,
                fr: 0, frCount: 0, res: 0, resCount: 0, sla: 0, slaCount: 0,
                csat: 0, csatCount: 0 };
  rows.forEach(m => {
    acc.created      += m.totalCreated;
    acc.resolved     += m.totalResolved;
    acc.autoResolved += m.autoResolved;
    acc.escalated    += m.totalEscalated;
    acc.reopened     += m.totalReopened;
    if (m.avgFirstResponseMinutes != null) { acc.fr  += m.avgFirstResponseMinutes; acc.frCount  += 1; }
    if (m.avgResolutionMinutes    != null) { acc.res += m.avgResolutionMinutes;    acc.resCount += 1; }
    if (m.slaComplianceRate       != null) { acc.sla += m.slaComplianceRate;       acc.slaCount += 1; }
    if (m.customerSatisfactionAvg != null) { acc.csat+= m.customerSatisfactionAvg; acc.csatCount+= 1; }
  });
  return {
    created:          acc.created,
    resolved:         acc.resolved,
    autoResolved:     acc.autoResolved,
    escalated:        acc.escalated,
    reopened:         acc.reopened,
    avgFirstResponse: acc.frCount   ? Math.round(acc.fr  / acc.frCount)  : 0,
    avgResolution:    acc.resCount  ? Math.round(acc.res / acc.resCount) : 0,
    slaCompliance:    acc.slaCount  ? acc.sla  / acc.slaCount            : 0,
    csat:             acc.csatCount ? acc.csat / acc.csatCount           : 0,
  };
}

/** Splits the window into current and previous periods of {@code days} length. */
function splitWindow(rows: DailyMetric[], days: number) {
  const sorted = [...rows].sort((a, b) => a.metricDate.localeCompare(b.metricDate));
  return {
    current:  sorted.slice(-days),
    previous: sorted.slice(-days * 2, -days),
  };
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function delta(current: number, previous: number): number {
  if (previous === 0 || !isFinite(previous)) return 0;
  return ((current - previous) / previous) * 100;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function rangeFrom(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function shortDate(iso: string): string {
  return iso.slice(5);
}
