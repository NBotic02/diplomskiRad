import { useState, useMemo } from 'react';
import {
  App, Badge, Button, Drawer, Empty, List, Space, Tag, Tooltip, Typography,
} from 'antd';
import {
  CheckOutlined, CloseOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { agentsApi, exceptionsApi } from '@/api/employees';
import type { ScheduleException } from '@/types/api';

const { Text } = Typography;

const EXCEPTION_TYPE_LABEL: Record<ScheduleException['exceptionType'], string> = {
  VACATION:   'Vacation',
  SICK_LEAVE: 'Sick leave',
  HOLIDAY:    'Holiday',
  TRAINING:   'Training',
  OTHER:      'Other',
};

const EXCEPTION_TYPE_COLOR: Record<ScheduleException['exceptionType'], string> = {
  VACATION:   'blue',
  SICK_LEAVE: 'red',
  HOLIDAY:    'purple',
  TRAINING:   'gold',
  OTHER:      'default',
};

interface PendingBlock {
  agentId:       string;
  ids:           string[];
  fromDate:      string;
  toDate:        string;
  exceptionType: ScheduleException['exceptionType'];
  reason:        string | null;
}

/** Group sorted pending exceptions into contiguous per-agent blocks. */
function groupBlocks(items: ScheduleException[]): PendingBlock[] {
  const sorted = [...items].sort((a, b) => {
    const byAgent = a.agentId.localeCompare(b.agentId);
    if (byAgent !== 0) return byAgent;
    return a.exceptionDate.localeCompare(b.exceptionDate);
  });
  const blocks: PendingBlock[] = [];
  for (const e of sorted) {
    const last = blocks[blocks.length - 1];
    const isContiguous =
      last &&
      last.agentId === e.agentId &&
      last.exceptionType === e.exceptionType &&
      (last.reason ?? null) === (e.reason ?? null) &&
      dayjs(e.exceptionDate).diff(dayjs(last.toDate), 'day') === 1;
    if (isContiguous) {
      last.ids.push(e.exceptionId);
      last.toDate = e.exceptionDate;
    } else {
      blocks.push({
        agentId:       e.agentId,
        ids:           [e.exceptionId],
        fromDate:      e.exceptionDate,
        toDate:        e.exceptionDate,
        exceptionType: e.exceptionType,
        reason:        e.reason,
      });
    }
  }
  return blocks;
}

function rangeLabel(b: PendingBlock): string {
  if (b.fromDate === b.toDate) return b.fromDate;
  return `${b.fromDate} → ${b.toDate}`;
}

/** Lead / admin approval queue for time-off requests. */
export function PendingApprovals({ approverAgentId }: { approverAgentId: string | undefined }) {
  const [open, setOpen] = useState(false);
  const { message } = App.useApp();
  const qc = useQueryClient();

  const pendingQ = useQuery({
    queryKey: ['exceptions', 'pending'],
    queryFn:  () => exceptionsApi.listPending(),
    refetchInterval: 15_000,
  });
  const agentsQ = useQuery({
    queryKey: ['agents'],
    queryFn:  () => agentsApi.list(),
  });

  const agentName = useMemo(() => {
    const m = new Map<string, string>();
    (agentsQ.data ?? []).forEach(a => m.set(a.agentId, `${a.firstName} ${a.lastName}`));
    return m;
  }, [agentsQ.data]);

  const approveMut = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id =>
      exceptionsApi.approve(id, approverAgentId ?? '00000000-0000-0000-0000-000000000001'),
    )),
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(
        ids.length === 1
          ? 'Time off approved'
          : `Approved ${ids.length}-day request`,
      );
    },
    onError: (e: Error) => message.error(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => exceptionsApi.reject(id))),
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      message.success(
        ids.length === 1
          ? 'Request rejected'
          : `Rejected ${ids.length}-day request`,
      );
    },
    onError: (e: Error) => message.error(e.message),
  });

  const items  = pendingQ.data ?? [];
  const blocks = useMemo(() => groupBlocks(items), [items]);

  const handleOpen = () => {
    setOpen(true);
    pendingQ.refetch();
  };

  return (
    <>
      <Tooltip title="Pending time-off requests awaiting your approval">
        <Badge count={blocks.length} size="small" offset={[-4, 4]} color="#dc2626">
          <Button icon={<InboxOutlined />} onClick={handleOpen}>
            Pending requests
          </Button>
        </Badge>
      </Tooltip>

      <Drawer
        open={open}
        title="Pending time-off requests"
        onClose={() => setOpen(false)}
        width={500}
        destroyOnClose={false}
      >
        {blocks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No requests waiting for a decision"
          />
        ) : (
          <List
            dataSource={blocks}
            renderItem={b => {
              const days = b.ids.length;
              return (
                <List.Item
                  key={b.ids[0]}
                  actions={[
                    <Tooltip key="approve" title={days === 1 ? 'Approve' : `Approve all ${days} days`}>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        size="small"
                        loading={approveMut.isPending && approveMut.variables === b.ids}
                        onClick={() => approveMut.mutate(b.ids)}
                      />
                    </Tooltip>,
                    <Tooltip key="reject" title={days === 1 ? 'Reject' : `Reject all ${days} days`}>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        size="small"
                        loading={rejectMut.isPending && rejectMut.variables === b.ids}
                        onClick={() => rejectMut.mutate(b.ids)}
                      />
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space size={8} wrap>
                        <Text strong>{agentName.get(b.agentId) ?? 'Agent'}</Text>
                        <Tag color={EXCEPTION_TYPE_COLOR[b.exceptionType]} bordered={false}>
                          {EXCEPTION_TYPE_LABEL[b.exceptionType]}
                        </Tag>
                        {days > 1 && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            · {days} days
                          </Text>
                        )}
                      </Space>
                    }
                    description={
                      <div style={{ lineHeight: 1.5 }}>
                        <div className="mono" style={{ fontSize: 12, color: '#52525b' }}>
                          {rangeLabel(b)}
                        </div>
                        {b.reason && (
                          <div style={{ fontSize: 12, color: '#3f3f46', marginTop: 4 }}>
                            {b.reason}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    </>
  );
}
