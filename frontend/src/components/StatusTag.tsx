import { Tag } from 'antd';
import type {
  CasePriority, CaseStatus, NotificationStatus, Severity, SlaStatus,
} from '@/types/api';

const priority: Record<CasePriority, string> = {
  CRITICAL: 'volcano',
  HIGH:     'orange',
  MEDIUM:   'default',
  LOW:      'default',
};

const status: Record<CaseStatus, string> = {
  NEW:               'gold',
  OPEN:              'processing',
  PENDING:           'default',
  ON_HOLD:           'default',
  PENDING_APPROVAL:  'gold',
  ESCALATED:         'orange',
  RESOLVED:          'green',
  CLOSED:            'default',
  REOPENED:          'gold',
};

const sla: Record<SlaStatus, string> = {
  WITHIN_SLA: 'green',
  AT_RISK:    'gold',
  BREACHED:   'red',
};

const severity: Record<Severity, string> = {
  LOW:      'default',
  MEDIUM:   'gold',
  HIGH:     'orange',
  CRITICAL: 'red',
};

const notif: Record<NotificationStatus, string> = {
  PENDING: 'default',
  SENT:    'green',
  FAILED:  'red',
};

const palettes = { priority, status, sla, severity, notif } as const;

interface Props {
  variant: keyof typeof palettes;
  value: string;
}

export function StatusTag({ variant, value }: Props) {
  const color = (palettes[variant] as Record<string, string>)[value] ?? 'default';
  return (
    <Tag color={color} style={{ marginInlineEnd: 0, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
      {value}
    </Tag>
  );
}
