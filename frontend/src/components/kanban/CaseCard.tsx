import { Avatar, Space, Tag, Tooltip, Typography } from 'antd';
import { ClockCircleOutlined, UserAddOutlined } from '@ant-design/icons';

import { StatusTag } from '@/components/StatusTag';
import { fmtRelative } from '@/lib/format';
import type { Agent, Case } from '@/types/api';

const { Text, Paragraph } = Typography;

interface CaseCardProps {
  case: Case;
  agent?: Agent;
  /** True iff the current user is allowed to claim unassigned cases. */
  canClaim?: boolean;
  onClick:  (c: Case) => void;
  onClaim?: (c: Case) => void;
}

/** Compact Kanban card showing case number, priority, subject, assignee and age. */
export function CaseCard({ case: c, agent, canClaim, onClick, onClaim }: CaseCardProps) {
  const unassigned = !c.assignedAgentId;

  return (
    <div
      onClick={() => onClick(c)}
      style={{
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        padding: 12,
        cursor: 'pointer',
        boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#d4d4d8';
        e.currentTarget.style.boxShadow   = '0 4px 12px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#e4e4e7';
        e.currentTarget.style.boxShadow   = '0 1px 0 rgba(0,0,0,0.02)';
      }}
    >
      <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text className="mono" type="secondary" style={{ fontSize: 11 }}>
          #{c.caseNumber ?? '—'}
        </Text>
        <StatusTag variant="priority" value={c.priority} />
      </Space>

      <Paragraph
        ellipsis={{ rows: 2 }}
        style={{
          margin: '6px 0 8px',
          fontSize: 13,
          fontWeight: 500,
          color: '#18181b',
          lineHeight: 1.35,
        }}
      >
        {c.subject}
      </Paragraph>

      <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
        {unassigned ? (
          canClaim && onClaim ? (
            <Tag
              icon={<UserAddOutlined />}
              color="default"
              onClick={e => { e.stopPropagation(); onClaim(c); }}
              style={{ cursor: 'pointer', fontSize: 11, padding: '0 8px' }}
            >
              Take it
            </Tag>
          ) : (
            <Tag color="default" style={{ fontSize: 11 }}>Unassigned</Tag>
          )
        ) : (
          <Tooltip title={agent ? `${agent.firstName} ${agent.lastName}` : c.assignedAgentId}>
            <Space size={6}>
              <Avatar size={20} style={{ background: '#27272a', fontSize: 10 }}>
                {agent ? `${agent.firstName[0]}${agent.lastName[0]}` : '?'}
              </Avatar>
              <Text style={{ fontSize: 11, color: '#52525b' }}>
                {agent ? agent.firstName : '—'}
              </Text>
            </Space>
          </Tooltip>
        )}

        <Tooltip title={c.createdAt}>
          <Text className="mono" type="secondary" style={{ fontSize: 10 }}>
            <ClockCircleOutlined style={{ marginInlineEnd: 4 }} />
            {fmtRelative(c.createdAt)}
          </Text>
        </Tooltip>
      </Space>
    </div>
  );
}
