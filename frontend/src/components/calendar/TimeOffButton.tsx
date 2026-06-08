import { useState } from 'react';
import { App, Button, DatePicker, Form, Input, Modal, Select, Tooltip } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';

import { exceptionsApi } from '@/api/employees';
import type { ScheduleExceptionType } from '@/types/api';

const { RangePicker } = DatePicker;

const TYPE_OPTIONS: { value: ScheduleExceptionType; label: string }[] = [
  { value: 'VACATION',   label: 'Vacation'    },
  { value: 'SICK_LEAVE', label: 'Sick leave'  },
  { value: 'TRAINING',   label: 'Training'    },
  { value: 'OTHER',      label: 'Other'       },
];

interface FormValues {
  range:         [Dayjs, Dayjs];
  exceptionType: ScheduleExceptionType;
  reason?:       string;
}

/** Button and modal to file a time-off request. */
export function TimeOffButton({ agentId, autoApproved = false }: { agentId: string; autoApproved?: boolean }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const qc = useQueryClient();

  const createMut = useMutation({
    mutationFn: (v: FormValues) => exceptionsApi.createRange(agentId, {
      fromDate:      v.range[0].format('YYYY-MM-DD'),
      toDate:        v.range[1].format('YYYY-MM-DD'),
      exceptionType: v.exceptionType,
      reason:        v.reason,
    }),
    onSuccess: (rows) => {
      qc.invalidateQueries({ queryKey: ['exceptions'] });
      const days = rows.length;
      const tail = autoApproved ? 'approved' : 'pending lead approval';
      message.success(
        days === 1
          ? `Request submitted, ${tail}`
          : `Request submitted for ${days} days, ${tail}`,
      );
      setOpen(false);
      form.resetFields();
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <>
      <Tooltip title={autoApproved
                       ? 'File time off (auto-approved)'
                       : 'Request a day off, pending lead approval'}>
        <Button icon={<CalendarOutlined />} onClick={() => setOpen(true)}>
          Request time off
        </Button>
      </Tooltip>

      <Modal
        open={open}
        title="Request time off"
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
        width={460}
      >
        <Form<FormValues>
          form={form}
          layout="vertical"
          initialValues={{
            exceptionType: 'VACATION',
            range: [dayjs().add(7, 'day'), dayjs().add(7, 'day')],
          }}
          onFinish={v => createMut.mutate(v)}
        >
          <Form.Item name="range" label="From – To"
                     tooltip="Pick a single day or a range; the request covers every day from the start to the end inclusive."
                     rules={[{ required: true, message: 'Pick a date range' }]}>
            <RangePicker style={{ width: '100%' }}
                         disabledDate={d => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item name="exceptionType" label="Type"
                     rules={[{ required: true }]}>
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="reason" label="Reason"
                     tooltip={autoApproved
                              ? 'Optional, kept on the schedule for visibility'
                              : 'Optional, visible to your lead in the approval queue'}>
            <Input.TextArea rows={3} placeholder="Annual leave, doctor's appointment, conference…" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>
              {autoApproved ? 'Submit' : 'Submit for approval'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
