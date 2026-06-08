import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Avatar, Button, Card, Empty, Input, Segmented, Select, Space,
  Spin, Tag, Tooltip, Typography,
} from 'antd';
import {
  CalendarOutlined, LeftOutlined, RightOutlined, SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

import { agentsApi, departmentsApi, exceptionsApi, shiftsApi } from '@/api/employees';
import { TimeOffButton } from '@/components/calendar/TimeOffButton';
import { MyTimeOffButton } from '@/components/calendar/MyTimeOffButton';
import { PendingApprovals } from '@/components/calendar/PendingApprovals';
import { AgentScheduleDrawer } from '@/components/calendar/AgentScheduleDrawer';
import { CaseDrawer } from '@/components/CaseDrawer';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { ShiftBar, SHIFT_BAR_GAP, SHIFT_BAR_HEIGHT } from '@/components/calendar/ShiftBar';
import {
  DAY_END_HOUR, DAY_NAMES_SHORT, DAY_START_HOUR, addDays, fmtWeekLabel,
  isSameDay, paletteFor, startOfWeek,
} from '@/components/calendar/shiftHelpers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Agent, AgentSchedule, ScheduleException, Shift } from '@/types/api';

const { Title, Text } = Typography;

const ALL_DEPTS = '__all__';
const AGENT_COL_WIDTH = 200;

type ViewMode = 'week' | 'month';

export function Calendar() {
  const me = useCurrentUser();

  const [viewMode,  setViewMode]  = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [search,    setSearch]    = useState('');
  const [adminDept, setAdminDept] = useState<string>(ALL_DEPTS);
  const [activeAgent,  setActiveAgent]  = useState<Agent | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const departmentId = me.isAdmin && adminDept !== ALL_DEPTS ? adminDept : undefined;

  const agentsQ = useQuery({
    queryKey: ['agents', { departmentId }],
    queryFn:  () => agentsApi.list(departmentId),
  });
  const shiftsQ = useQuery({ queryKey: ['shifts'], queryFn: () => shiftsApi.list() });
  const deptsQ  = useQuery({
    queryKey: ['departments'], queryFn: () => departmentsApi.list(), enabled: me.isAdmin,
  });

  const schedulesQ = useQueries({
    queries: (agentsQ.data ?? []).map(a => ({
      queryKey: ['agent-schedules', a.agentId],
      queryFn:  () => agentsApi.schedules(a.agentId),
    })),
  });

  const shiftsById = useMemo(() => {
    const m = new Map<string, Shift>();
    shiftsQ.data?.forEach(s => m.set(s.shiftId, s));
    return m;
  }, [shiftsQ.data]);

  const schedulesByAgent = useMemo(() => {
    const m = new Map<string, AgentSchedule[]>();
    (agentsQ.data ?? []).forEach((a, i) => {
      m.set(a.agentId, schedulesQ[i]?.data ?? []);
    });
    return m;
  }, [agentsQ.data, schedulesQ]);

  const weekEndIso = useMemo(() => isoDate(addDays(weekStart, 6)), [weekStart]);
  const weekStartIso = useMemo(() => isoDate(weekStart), [weekStart]);
  const exceptionsQ = useQuery({
    queryKey: ['exceptions', 'approved', weekStartIso, weekEndIso],
    queryFn:  () => exceptionsApi.listApproved(weekStartIso, weekEndIso),
  });
  const exceptionByAgentDay = useMemo(() => {
    const m = new Map<string, ScheduleException>();
    (exceptionsQ.data ?? []).forEach(e => {
      m.set(`${e.agentId}|${e.exceptionDate}`, e);
    });
    return m;
  }, [exceptionsQ.data]);

  type Cell = { dow: number; shifts: Shift[] };
  type Row  = { agent: Agent; cells: Cell[] };

  const rows = useMemo<Row[]>(() => {
    if (!agentsQ.data || !shiftsQ.data) return [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? agentsQ.data.filter(a =>
          `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(q))
      : agentsQ.data;
    const weekEnd = addDays(weekStart, 6);
    return filtered.map(a => {
      const schedules = (schedulesByAgent.get(a.agentId) ?? []).filter(s => {
        const from = new Date(s.effectiveFrom);
        const to   = s.effectiveTo ? new Date(s.effectiveTo) : null;
        return from <= weekEnd && (!to || to >= weekStart);
      });
      const shifts    = schedules
        .map(s => shiftsById.get(s.shiftId))
        .filter((sh): sh is Shift => !!sh);
      const cells: Cell[] = [];
      for (let d = 1; d <= 7; d++) {
        cells.push({ dow: d, shifts: shifts.filter(s => s.daysOfWeek.includes(d)) });
      }
      return { agent: a, cells };
    });
  }, [agentsQ.data, shiftsQ.data, schedulesByAgent, shiftsById, search, weekStart]);

  const orderedRows = useMemo(() => {
    if (!me.agentId) return rows;
    const mine  = rows.find(r => r.agent.agentId === me.agentId);
    const other = rows.filter(r => r.agent.agentId !== me.agentId);
    return mine ? [mine, ...other] : rows;
  }, [rows, me.agentId]);

  const coverage = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const r of rows) {
      r.cells.forEach((c, i) => { if (c.shifts.length) counts[i] += 1; });
    }
    return counts;
  }, [rows]);

  const today = new Date();
  const todayInWeek = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
         .findIndex(d => isSameDay(d, today)),
  [weekStart]);

  const goPrev   = () => {
    if (viewMode === 'week') setWeekStart(d => addDays(d, -7));
    else setWeekStart(d => {
      const x = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      return startOfWeek(x);
    });
  };
  const goNext   = () => {
    if (viewMode === 'week') setWeekStart(d => addDays(d, 7));
    else setWeekStart(d => {
      const x = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return startOfWeek(x);
    });
  };
  const goToday  = () => setWeekStart(startOfWeek(new Date()));

  const isLoading = agentsQ.isLoading || shiftsQ.isLoading;

  const monthLabel = (() => {
    const ref = addDays(weekStart, 3);
    return ref.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  })();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                    marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Coverage</span>
          <Title level={1} style={{ marginTop: 4, marginBottom: 0 }}>
            Schedule
          </Title>
        </div>

        <Space size={8} wrap>
          {me.agentId && (
            <>
              <MyTimeOffButton agentId={me.agentId} />
              <TimeOffButton agentId={me.agentId} autoApproved={me.canSeeTeam} />
            </>
          )}
          {me.canSeeTeam && <PendingApprovals approverAgentId={me.agentId} />}
          <Tooltip title={viewMode === 'week' ? 'Previous week' : 'Previous month'}>
            <Button icon={<LeftOutlined />} onClick={goPrev} />
          </Tooltip>
          <Button onClick={goToday} icon={<CalendarOutlined />}>
            Today
          </Button>
          <Tooltip title={viewMode === 'week' ? 'Next week' : 'Next month'}>
            <Button icon={<RightOutlined />} onClick={goNext} />
          </Tooltip>
          <Text strong style={{ minWidth: 220, textAlign: 'center', fontSize: 14 }}>
            {viewMode === 'week' ? fmtWeekLabel(weekStart) : monthLabel}
          </Text>
        </Space>
      </div>

      <Space wrap size="middle" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search agent"
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        {me.isAdmin && (
          <Select
            value={adminDept}
            onChange={setAdminDept}
            style={{ minWidth: 220 }}
            options={[
              { value: ALL_DEPTS, label: 'All departments' },
              ...(deptsQ.data?.map(d => ({ value: d.departmentId, label: d.name })) ?? []),
            ]}
          />
        )}
        <Segmented<ViewMode>
          value={viewMode}
          onChange={v => setViewMode(v as ViewMode)}
          options={[
            { label: 'Week',  value: 'week'  },
            { label: 'Month', value: 'month' },
          ]}
        />
        <LegendDots />
      </Space>

      {isLoading ? (
        <Card><Spin /></Card>
      ) : viewMode === 'month' ? (
        <Card>
          <MonthGrid
            monthAnchor={addDays(weekStart, 3)}
            agents={agentsQ.data ?? []}
            shifts={shiftsQ.data ?? []}
            schedulesByAgent={schedulesByAgent}
            onDayClick={d => {
              setWeekStart(startOfWeek(d));
              setViewMode('week');
            }}
          />
        </Card>
      ) : !orderedRows.length ? (
        <Card><Empty description="No agents to show" /></Card>
      ) : (
        <Card styles={{ body: { padding: 0 } }}>
          <div style={{ overflow: 'auto' }}>
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 900,
            }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #e4e4e7' }}>
                  <th style={{ ...thStyle, width: AGENT_COL_WIDTH, textAlign: 'left', paddingLeft: 16 }}>
                    Agent
                  </th>
                  {DAY_NAMES_SHORT.map((n, i) => {
                    const date = addDays(weekStart, i);
                    const isToday = i === todayInWeek;
                    return (
                      <th key={i} style={{
                        ...thStyle,
                        background: isToday ? '#fef3c7' : undefined,
                        borderBottom: isToday ? '2px solid #d97706' : undefined,
                      }}>
                        <div style={{ fontSize: 11, color: isToday ? '#92400e' : '#71717a',
                                      letterSpacing: '0.06em' }}>
                          {n.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600,
                                      color: isToday ? '#92400e' : '#18181b',
                                      fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
                          {date.getDate()}
                        </div>
                        <div style={{ fontSize: 10, color: '#a1a1aa' }}>
                          {coverage[i]} on duty
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {orderedRows.map(r => {
                  const isMe = r.agent.agentId === me.agentId;
                  return (
                    <tr key={r.agent.agentId} style={{
                      background: isMe ? '#fffbeb' : undefined,
                      borderBottom: '1px solid #f4f4f5',
                    }}>
                      <td
                        onClick={() => setActiveAgent(r.agent)}
                        style={{
                          ...tdStyle,
                          width: AGENT_COL_WIDTH,
                          textAlign: 'left',
                          paddingLeft: 16,
                          cursor: 'pointer',
                          borderRight: '1px solid #f4f4f5',
                          position: 'sticky',
                          left: 0,
                          background: isMe ? '#fffbeb' : '#ffffff',
                          zIndex: 1,
                        }}
                      >
                        <Space size={10}>
                          <Avatar size={28} style={{
                            background: isMe ? '#d97706' : '#27272a',
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            {r.agent.firstName[0]}{r.agent.lastName[0]}
                          </Avatar>
                          <div style={{ lineHeight: 1.25 }}>
                            <div style={{ fontWeight: 500, fontSize: 13, color: '#18181b' }}>
                              {r.agent.firstName} {r.agent.lastName}
                              {isMe && <Tag color="gold" bordered={false}
                                            style={{ marginLeft: 6, fontSize: 10, padding: '0 6px' }}>
                                       you</Tag>}
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {r.agent.role} · {r.agent.maxConcurrentCases} cap
                            </Text>
                          </div>
                        </Space>
                      </td>
                      {r.cells.map((cell, cIdx) => {
                        const isToday = cIdx === todayInWeek;
                        const cellDate = addDays(weekStart, cIdx);
                        const exception = exceptionByAgentDay.get(
                          `${r.agent.agentId}|${isoDate(cellDate)}`,
                        );
                        const trackHeight = Math.max(
                          SHIFT_BAR_HEIGHT,
                          cell.shifts.length * (SHIFT_BAR_HEIGHT + SHIFT_BAR_GAP) - SHIFT_BAR_GAP,
                        );
                        return (
                          <td key={cIdx} style={{
                            ...tdStyle,
                            background: isToday ? '#fffbeb55' : undefined,
                            borderRight: '1px solid #f4f4f5',
                            padding: 6,
                          }}>
                            {exception || cell.shifts.length === 0 ? (
                              <OffCell exception={exception} />
                            ) : (
                              <div style={{
                                position: 'relative',
                                height: trackHeight,
                                background: `repeating-linear-gradient(
                                  90deg,
                                  #00000005 0,
                                  #00000005 1px,
                                  transparent 1px,
                                  transparent ${100 / (DAY_END_HOUR - DAY_START_HOUR)}%
                                )`,
                              }}>
                                {cell.shifts.map((s, i) => (
                                  <ShiftBar key={s.shiftId} shift={s} trackIdx={i} />
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `${AGENT_COL_WIDTH}px repeat(7, 1fr)`,
            borderTop: '1px solid #f4f4f5',
            padding: '6px 0',
            fontSize: 10,
            color: '#a1a1aa',
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          }}>
            <div style={{ paddingLeft: 16 }}>{DAY_START_HOUR}h – {DAY_END_HOUR}h window</div>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                     padding: '0 6px' }}>
                <span>{DAY_START_HOUR}</span>
                <span>{Math.round((DAY_START_HOUR + DAY_END_HOUR) / 2)}</span>
                <span>{DAY_END_HOUR}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <AgentScheduleDrawer
        agent={activeAgent}
        shifts={shiftsQ.data ?? []}
        onClose={() => setActiveAgent(null)}
        onCaseClick={id => setActiveCaseId(id)}
      />
      <CaseDrawer caseId={activeCaseId} onClose={() => setActiveCaseId(null)} />
    </div>
  );
}

function LegendDots() {
  const items = [
    { name: 'Morning',  ...paletteFor('morning') },
    { name: 'Evening',  ...paletteFor('evening') },
    { name: 'On-call',  ...paletteFor('on-call') },
  ];
  return (
    <Space size={10} style={{ paddingLeft: 6 }}>
      {items.map(d => (
        <Space key={d.name} size={5}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18, height: 18, borderRadius: 4,
            background: d.bg, border: `1px solid ${d.border}`, color: d.text,
            fontSize: 11, fontFamily: 'system-ui, sans-serif',
          }}>{d.icon}</span>
          <Text type="secondary" style={{ fontSize: 11 }}>{d.name}</Text>
        </Space>
      ))}
      <Tooltip title="Click an agent's name to see their caseload by priority">
        <Tag bordered={false} icon={<ThunderboltOutlined />}
             style={{ margin: 0, background: '#fafafa' }}>
          Click name for details
        </Tag>
      </Tooltip>
    </Space>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 6px',
  fontSize: 11,
  fontWeight: 600,
  textAlign: 'center',
  color: '#52525b',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderRight: '1px solid #f4f4f5',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  verticalAlign: 'middle',
};

const EXCEPTION_LABEL: Record<ScheduleException['exceptionType'], string> = {
  VACATION:   'Vacation',
  SICK_LEAVE: 'Sick leave',
  HOLIDAY:    'Holiday',
  TRAINING:   'Training',
  OTHER:      'Other',
};

function OffCell({ exception }: { exception?: ScheduleException }) {
  const cell = (
    <div style={{
      fontSize: 11,
      color: '#a1a1aa',
      letterSpacing: '0.08em',
      fontWeight: 600,
      textAlign: 'center',
      background:
        'repeating-linear-gradient(' +
        '45deg, ' +
        '#f4f4f5 0, #f4f4f5 6px, ' +
        '#fafafa 6px, #fafafa 12px' +
        ')',
      border: '1px dashed #e4e4e7',
      borderRadius: 4,
      padding: '8px 0',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      cursor: exception ? 'help' : 'default',
    }}>
      OFF
    </div>
  );
  if (!exception) return cell;
  return (
    <Tooltip title={
      <div style={{ lineHeight: 1.4 }}>
        <div style={{ fontWeight: 600 }}>{EXCEPTION_LABEL[exception.exceptionType]}</div>
        {exception.reason && <div>{exception.reason}</div>}
      </div>
    }>
      {cell}
    </Tooltip>
  );
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
