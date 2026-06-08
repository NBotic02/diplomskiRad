import { Empty, Tag } from 'antd';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  title:    string;
  count:    number;
  /** Optional badge styling — e.g. "danger" for ESCALATED. */
  tone?:    'default' | 'amber' | 'red' | 'green' | 'blue';
  children: ReactNode;
}

const TONE_BG: Record<NonNullable<KanbanColumnProps['tone']>, string> = {
  default: '#fafafa',
  amber:   '#fffbeb',
  red:     '#fef2f2',
  green:   '#f0fdf4',
  blue:    '#eff6ff',
};

const TONE_BORDER: Record<NonNullable<KanbanColumnProps['tone']>, string> = {
  default: '#e4e4e7',
  amber:   '#fde68a',
  red:     '#fecaca',
  green:   '#bbf7d0',
  blue:    '#bfdbfe',
};

const TONE_TAG: Record<NonNullable<KanbanColumnProps['tone']>, string> = {
  default: 'default',
  amber:   'gold',
  red:     'red',
  green:   'green',
  blue:    'blue',
};

/** Single Kanban column with fixed width and pinned header. */
export function KanbanColumn({ title, count, tone = 'default', children }: KanbanColumnProps) {
  return (
    <div
      style={{
        flex: '0 0 280px',
        display: 'flex',
        flexDirection: 'column',
        background: TONE_BG[tone],
        border: `1px solid ${TONE_BORDER[tone]}`,
        borderRadius: 12,
        minWidth: 280,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px solid ${TONE_BORDER[tone]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#52525b',
        }}>{title}</span>
        <Tag bordered={false} color={TONE_TAG[tone]} style={{ margin: 0, fontSize: 11 }}>
          {count}
        </Tag>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {count === 0
          ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={null} style={{ marginTop: 32, opacity: 0.5 }} />
          : children}
      </div>
    </div>
  );
}
