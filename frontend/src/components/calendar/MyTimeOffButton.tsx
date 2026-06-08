import { useState } from 'react';
import {
  App, Badge, Button, DatePicker, Drawer, Empty, Form, Input, List, Modal,
  Popconfirm, Select, Space, Tag, Tooltip, Typography,
} from 'antd';
import {
  CalendarOutlined, CheckCircleFilled, ClockCircleFilled, DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';

import { exceptionsApi } from '@/api/employees';
import type { ScheduleException, ScheduleExceptionType } from '@/types/api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

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

const TYPE_OPTIONS: { value: ScheduleExceptionType; label: string }[] = [
  { value: 'VACATION',   label: 'Vacation'    },
  { value: 'SICK_LEAVE', label: 'Sick leave'  },
  { value: 'TRAINING',   label: 'Training'    },
  { value: 'OTHER',      label: 'Other'       },
];

interface Block {
  ids:           string[];
  fromDate:      string;
  toDate:        string;
  exceptionType: ScheduleException['exceptionType'];
  reason:        string | null;
  isApproved:    boolean;
}

/** Group sorted exceptions into contiguous blocks. */
function groupBlocks(items: ScheduleException[]): Block[] {
  const sorted = [...items].sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate));
  const blocks: Block[] = [];
  for (const e of sorted) {
    const last = blocks[blocks.length - 1];
    const isContiguous =
      last &&
      last.exceptionType === e.exceptionType &&
      (last.reason ?? null) === (e.reason ?? null) &&
      last.isApproved === e.isApproved &&
      dayjs(e.exceptionDate).diff(dayjs(last.toDate), 'day') === 1;
    if (isContiguous) {
      last.ids.push(e.exceptionId);
      last.toDate = e.exceptionDate;
    } else {
      blocks.push({
        ids:           [e.exceptionId],
        fromDate:      e.exceptionDate,
        toDate:        e.exceptionDate,
        exceptionType: e.exceptionType,
        reason:        e.reason,
        isApproved:    e.isApproved,
      });
    }
  }
  return blocks;
}

function rangeLabel(b: Block): string {
  if (b.fromDate === b.toDate) return b.fromDate;
  return `${b.fromDate} → ${b.toDate}`;
}

function dayCount(b: Block): number { return b.ids.length; }

interface EditState {
  ids:           string[];
  range:         [Dayjs, Dayjs];
  exceptionType: ScheduleExceptionType;
  reason:        string;
}

/** Agent's own time-off requests, grouped into blocks per submission. */
export function MyTimeOffButton({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editForm] = Form.useForm<{
    range: [Dayjs, Dayjs];
    exceptionType: ScheduleExceptionType;
    reason?: string;
  }>();
  const { message } = App.useApp();
  const qc = useQueryClient();

  const exceptionsQ = useQuery({
    queryKey: ['exceptions', 'mine', agentId],
    queryFn:  () => exceptionsApi.listForAgent(agentId),
    refetchInterval: 60_000,
  });

  const deleteBlockMut = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => exceptionsApi.reject(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      message.success('Request cancelled');
    },
    onError: (e: Error) => message.error(e.message),
  });

  const saveEditMut = useMutation({
    mutationFn: async (vars: {
      ids: string[];
      fromDate: string;
      toDate: string;
      exceptionType: ScheduleExceptionType;
      reason?: string;
    }) => {
      await Promise.all(vars.ids.map(id => exceptionsApi.reject(id)));
      return exceptionsApi.createRange(agentId, {
        fromDate:      vars.fromDate,
        toDate:        vars.toDate,
        exceptionType: vars.exceptionType,
        reason:        vars.reason,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      message.success('Request updated');
      setEditing(null);
      editForm.resetFields();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const all = exceptionsQ.data ?? [];
  const pendingBlocks  = groupBlocks(all.filter(e => !e.isApproved));
  const approvedBlocks = groupBlocks(all.filter(e =>  e.isApproved));

  const openEdit = (b: Block) => {
    setEditing({
      ids:           b.ids,
      range:         [dayjs(b.fromDate), dayjs(b.toDate)],
      exceptionType: b.exceptionType,
      reason:        b.reason ?? '',
    });
    editForm.setFieldsValue({
      range:         [dayjs(b.fromDate), dayjs(b.toDate)],
      exceptionType: b.exceptionType,
      reason:        b.reason ?? '',
    });
  };

  return (
    <>
      <Tooltip title="Your upcoming time-off requests and their status">
        <Badge
          count={pendingBlocks.length}
          size="small"
          offset={[-4, 4]}
          color={pendingBlocks.length > 0 ? '#d97706' : '#a1a1aa'}
        >
          <Button icon={<CalendarOutlined />} onClick={() => setOpen(true)}>
            My time off
          </Button>
        </Badge>
      </Tooltip>

      <Drawer
        open={open}
        title="My time-off requests"
        onClose={() => setOpen(false)}
        width={500}
      >
        <Section
          title="Pending"
          icon={<ClockCircleFilled style={{ color: '#d97706' }} />}
          blocks={pendingBlocks}
          empty="No pending requests"
          renderActions={b => [
            <Tooltip key="edit" title="Edit dates / reason">
              <Button icon={<EditOutlined />} size="small"
                      onClick={() => openEdit(b)} />
            </Tooltip>,
            <Popconfirm
              key="cancel"
              title={`Cancel this ${dayCount(b)}-day request?`}
              okText="Cancel request"
              cancelText="Keep"
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteBlockMut.mutate(b.ids)}
            >
              <Tooltip title="Withdraw this request">
                <Button danger icon={<DeleteOutlined />} size="small" />
              </Tooltip>
            </Popconfirm>,
          ]}
        />

        <div style={{ height: 16 }} />

        <Section
          title="Approved"
          icon={<CheckCircleFilled style={{ color: '#059669' }} />}
          blocks={approvedBlocks}
          empty="No approved time off coming up"
        />
      </Drawer>

      <Modal
        open={!!editing}
        title="Edit time-off request"
        onCancel={() => { setEditing(null); editForm.resetFields(); }}
        footer={null}
        destroyOnClose
        width={460}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={v => editing && saveEditMut.mutate({
            ids:           editing.ids,
            fromDate:      v.range[0].format('YYYY-MM-DD'),
            toDate:        v.range[1].format('YYYY-MM-DD'),
            exceptionType: v.exceptionType,
            reason:        v.reason,
          })}
        >
          <Form.Item name="range" label="From – To"
                     rules={[{ required: true, message: 'Pick a date range' }]}>
            <RangePicker style={{ width: '100%' }}
                         disabledDate={d => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item name="exceptionType" label="Type"
                     rules={[{ required: true }]}>
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={3} placeholder="Annual leave, doctor's appointment, conference…" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setEditing(null); editForm.resetFields(); }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saveEditMut.isPending}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

function Section({
  title, icon, blocks, empty, renderActions,
}: {
  title: string;
  icon: React.ReactNode;
  blocks: Block[];
  empty: string;
  renderActions?: (b: Block) => React.ReactNode[];
}) {
  const totalDays = blocks.reduce((sum, b) => sum + dayCount(b), 0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <Text strong style={{ fontSize: 13 }}>
          {title}{' '}
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({blocks.length} {blocks.length === 1 ? 'request' : 'requests'} ·{' '}
            {totalDays} {totalDays === 1 ? 'day' : 'days'})
          </Text>
        </Text>
      </div>
      {blocks.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />
      ) : (
        <List
          dataSource={blocks}
          renderItem={b => (
            <List.Item
              key={b.ids[0]}
              actions={renderActions ? renderActions(b) : undefined}
            >
              <List.Item.Meta
                title={
                  <Space size={8} wrap>
                    <Tag color={EXCEPTION_TYPE_COLOR[b.exceptionType]} bordered={false}>
                      {EXCEPTION_TYPE_LABEL[b.exceptionType]}
                    </Tag>
                    <Text strong className="mono" style={{ fontSize: 12, color: '#18181b' }}>
                      {rangeLabel(b)}
                    </Text>
                    {dayCount(b) > 1 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        · {dayCount(b)} days
                      </Text>
                    )}
                  </Space>
                }
                description={b.reason ?? <Text type="secondary">No note</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
