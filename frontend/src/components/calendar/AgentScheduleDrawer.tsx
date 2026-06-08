import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar, Badge, Card, Carousel, Descriptions, Drawer, Empty, Progress,
  Space, Spin, Statistic, Tag, Tooltip, Typography,
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, MailOutlined, PhoneOutlined,
  ThunderboltOutlined, TrophyOutlined, UserOutlined,
} from '@ant-design/icons';

import { casesApi } from '@/api/cases';
import { agentsApi } from '@/api/employees';
import { StatusTag } from '@/components/StatusTag';
import { fmtRelative } from '@/lib/format';
import type { Agent, Case, CasePriority, Shift } from '@/types/api';
import { isCurrentlyOnShift } from './shiftHelpers';

const { Title, Text, Paragraph } = Typography;

const PRIORITY_ORDER: CasePriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const PRIORITY_TONE: Record<CasePriority, { color: string; tone: string; bg: string }> = {
  CRITICAL: { color: '#dc2626', tone: 'volcano', bg: '#fef2f2' },
  HIGH:     { color: '#d97706', tone: 'orange',  bg: '#fffbeb' },
  MEDIUM:   { color: '#52525b', tone: 'default', bg: '#fafafa' },
  LOW:      { color: '#71717a', tone: 'default', bg: '#fafafa' },
};

interface AgentScheduleDrawerProps {
  agent:   Agent | null;
  shifts:  Shift[];
  onClose: () => void;
  /** Optional callback when a case card is clicked — e.g. navigate to it. */
  onCaseClick?: (caseId: string) => void;
}

/** Drawer with agent profile, skills, schedule and caseload by priority. */
export function AgentScheduleDrawer({ agent, shifts, onClose, onCaseClick }: AgentScheduleDrawerProps) {
  const open = !!agent;

  const skillsQ = useQuery({
    queryKey: ['agent', agent?.agentId, 'skills'],
    queryFn:  () => agentsApi.skills(agent!.agentId),
    enabled:  open,
  });

  const schedulesQ = useQuery({
    queryKey: ['agent', agent?.agentId, 'schedules'],
    queryFn:  () => agentsApi.schedules(agent!.agentId),
    enabled:  open,
  });

  const casesQ = useQuery({
    queryKey: ['agent-cases', agent?.agentId],
    queryFn:  () => casesApi.list({ assignedAgentId: agent!.agentId, size: 100 }),
    enabled:  open,
  });

  const cases = casesQ.data?.content ?? [];
  const activeCases = cases.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const resolvedCount = cases.length - activeCases.length;

  const casesByPriority = useMemo(() => {
    const out = new Map<CasePriority, Case[]>();
    PRIORITY_ORDER.forEach(p => out.set(p, []));
    for (const c of activeCases) out.get(c.priority)?.push(c);
    return PRIORITY_ORDER
      .map(p => ({ priority: p, list: out.get(p) ?? [] }))
      .filter(b => b.list.length > 0);
  }, [activeCases]);

  const utilisation = agent ? Math.min(100, Math.round((activeCases.length / agent.maxConcurrentCases) * 100)) : 0;
  const utilColor = utilisation >= 90 ? '#dc2626' : utilisation >= 70 ? '#d97706' : '#059669';

  const onShiftNow = useMemo(() => {
    if (!schedulesQ.data || !shifts.length) return null;
    for (const s of schedulesQ.data) {
      if (!s.isActive) continue;
      const shift = shifts.find(x => x.shiftId === s.shiftId);
      if (shift && isCurrentlyOnShift(shift)) return shift;
    }
    return null;
  }, [schedulesQ.data, shifts]);

  if (!agent) {
    return <Drawer open={open} onClose={onClose} width={560} />;
  }

  const initials = `${agent.firstName[0]}${agent.lastName[0]}`.toUpperCase();

  return (
    <Drawer
      open={open}
      width={620}
      onClose={onClose}
      destroyOnClose
      title={
        <Space size={12} align="center">
          <Badge dot={!!onShiftNow} color="#059669" offset={[-4, 36]}>
            <Avatar size={44} style={{ background: '#18181b', fontWeight: 600 }}>
              {initials}
            </Avatar>
          </Badge>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 16 }}>{agent.firstName} {agent.lastName}</Text>
            <Space size={6}>
              <Tag color={agent.role === 'LEAD' ? 'gold' : agent.role === 'ADMIN' ? 'magenta' : 'blue'}
                   bordered={false} style={{ margin: 0 }}>
                {agent.role}
              </Tag>
              <Text type="secondary" className="mono" style={{ fontSize: 11 }}>
                {agent.employeeNumber}
              </Text>
              {onShiftNow && (
                <Tag color="green" bordered={false} icon={<ClockCircleOutlined />}>
                  On {onShiftNow.name.toLowerCase()} now
                </Tag>
              )}
            </Space>
          </Space>
        </Space>
      }
    >
      <Card size="small" styles={{ body: { padding: '12px 16px' } }} style={{ marginBottom: 16 }}>
        <Space size={32} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Statistic
            title="Active cases"
            value={activeCases.length}
            valueStyle={{ fontSize: 22, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
          />
          <Statistic
            title="Resolved (window)"
            value={resolvedCount}
            valueStyle={{ fontSize: 22, color: '#059669', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
          />
          <div style={{ minWidth: 140 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Capacity</Text>
            <Tooltip title={`${activeCases.length} of ${agent.maxConcurrentCases}`}>
              <Progress
                percent={utilisation}
                strokeColor={utilColor}
                size="small"
                format={p => `${p}%`}
              />
            </Tooltip>
          </div>
        </Space>
      </Card>

      <Card size="small" title="Profile" style={{ marginBottom: 16 }}
            styles={{ body: { padding: 0 } }}>
        <Descriptions
          column={1} size="small" bordered
          labelStyle={{ width: 100, fontSize: 12, color: '#71717a' }}
          contentStyle={{ fontSize: 12 }}
        >
          <Descriptions.Item label={<><MailOutlined /> Email</>}>
            <Text className="mono" copyable={{ text: agent.email }}>{agent.email}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
            {agent.phone ?? <Text type="secondary">—</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined /> Hired</>}>
            <Text className="mono">{agent.hireDate ?? '—'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><TrophyOutlined /> Skills</>}>
            {skillsQ.isLoading ? (
              <Spin size="small" />
            ) : skillsQ.data?.length ? (
              <Space size={4} wrap>
                {skillsQ.data.map(s => (
                  <Tag key={s.skillId} color="blue" bordered={false}>
                    {s.skillName} <span style={{ opacity: 0.6 }}>· {s.proficiency.slice(0, 3).toLowerCase()}</span>
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No skills on file</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small"
            title={<Space><ThunderboltOutlined /> Caseload by priority</Space>}
            extra={<Text type="secondary" style={{ fontSize: 11 }}>
                     {casesByPriority.length
                       ? `${casesByPriority.length} priority bucket${casesByPriority.length > 1 ? 's' : ''}`
                       : ''}
                   </Text>}
            style={{ marginBottom: 16 }}>
        {casesQ.isLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', height: 200 }}><Spin /></div>
        ) : casesByPriority.length === 0 ? (
          <Empty description="No active cases — clean plate" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Carousel
            dots
            arrows
            infinite={false}
            adaptiveHeight
            style={{ paddingBottom: 8 }}
          >
            {casesByPriority.map(({ priority, list }) => {
              const tone = PRIORITY_TONE[priority];
              return (
                <div key={priority}>
                  <div style={{
                    background:   tone.bg,
                    border:       `1px solid ${tone.color}33`,
                    borderRadius: 8,
                    padding:      12,
                    minHeight:    220,
                  }}>
                    <Space style={{ marginBottom: 10 }} align="center">
                      <Tag color={tone.tone} bordered={false} style={{
                        margin: 0, fontSize: 11, padding: '2px 10px',
                      }}>
                        {priority}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {list.length} case{list.length > 1 ? 's' : ''}
                      </Text>
                    </Space>
                    <Space direction="vertical" style={{ width: '100%' }} size={6}>
                      {list.slice(0, 5).map(c => (
                        <div
                          key={c.caseId}
                          onClick={() => onCaseClick?.(c.caseId)}
                          style={{
                            background:   '#ffffff',
                            border:       '1px solid #e4e4e7',
                            borderRadius: 6,
                            padding:      '8px 10px',
                            cursor:       onCaseClick ? 'pointer' : 'default',
                            display:      'flex',
                            alignItems:   'center',
                            gap:          10,
                          }}
                          onMouseEnter={e => onCaseClick &&
                            (e.currentTarget.style.borderColor = tone.color)}
                          onMouseLeave={e => onCaseClick &&
                            (e.currentTarget.style.borderColor = '#e4e4e7')}
                        >
                          <Text className="mono" type="secondary" style={{ fontSize: 11, minWidth: 56 }}>
                            #{c.caseNumber ?? '—'}
                          </Text>
                          <Paragraph ellipsis={{ rows: 1 }} style={{
                            flex: 1, margin: 0, fontSize: 12, fontWeight: 500,
                          }}>
                            {c.subject}
                          </Paragraph>
                          <StatusTag variant="status" value={c.status} />
                          <Text type="secondary" className="mono" style={{ fontSize: 10, minWidth: 70, textAlign: 'right' }}>
                            {fmtRelative(c.createdAt)}
                          </Text>
                        </div>
                      ))}
                      {list.length > 5 && (
                        <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
                          + {list.length - 5} more
                        </Text>
                      )}
                    </Space>
                  </div>
                </div>
              );
            })}
          </Carousel>
        )}
      </Card>

      <Card size="small" title="Active shifts" styles={{ body: { padding: '12px 16px' } }}>
        {schedulesQ.isLoading ? (
          <Spin size="small" />
        ) : schedulesQ.data?.length ? (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {schedulesQ.data.filter(s => s.isActive).map(s => {
              const shift = shifts.find(x => x.shiftId === s.shiftId);
              if (!shift) return null;
              return (
                <Space key={s.scheduleId} size={10}>
                  <Tag bordered={false} color="blue" style={{ margin: 0 }}>
                    {shift.name}
                  </Tag>
                  <Text className="mono" style={{ fontSize: 12 }}>
                    {shift.startTime}–{shift.endTime}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {shift.daysOfWeek.length === 7 ? 'every day'
                      : shift.daysOfWeek.length === 5 && shift.daysOfWeek.every((d, i) => d === i + 1) ? 'Mon–Fri'
                      : shift.daysOfWeek.map(d => ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')}
                  </Text>
                </Space>
              );
            })}
          </Space>
        ) : (
          <Text type="secondary">No active schedule</Text>
        )}
      </Card>
    </Drawer>
  );
}

void Title;
