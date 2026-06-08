import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Form, Input, InputNumber, Modal, Select, Space, Switch } from 'antd';

import { agentsApi, type CreateAgentBody, type UpdateAgentBody } from '@/api/employees';
import type { Agent, AgentRole } from '@/types/api';

const ROLES: AgentRole[] = ['AGENT', 'LEAD', 'ADMIN'];

interface AgentFormModalProps {
  open:       boolean;
  /** When set, the modal opens in edit mode for this agent. Omit to add. */
  agent?:     Agent | null;
  /** Restricts the role select for non-admins (leads can't change role). */
  canEditRole?: boolean;
  onClose:    () => void;
}

interface FormValues {
  employeeNumber:      string;
  firstName:           string;
  lastName:            string;
  email:               string;
  phone?:              string;
  role:                AgentRole;
  hireDate?:           string;
  maxConcurrentCases:  number;
  isActive?:           boolean;
}

/** Create / edit agent modal, switched by the agent prop. */
export function AgentFormModal({ open, agent, canEditRole = true, onClose }: AgentFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const qc     = useQueryClient();
  const { message } = App.useApp();
  const isEdit = !!agent;

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (agent) {
        form.setFieldsValue({
          employeeNumber:     agent.employeeNumber,
          firstName:          agent.firstName,
          lastName:           agent.lastName,
          email:              agent.email,
          phone:              agent.phone ?? undefined,
          role:               agent.role,
          maxConcurrentCases: agent.maxConcurrentCases,
          isActive:           agent.isActive,
        });
      } else {
        form.setFieldsValue({
          role: 'AGENT',
          maxConcurrentCases: 10,
          isActive: true,
        });
      }
    }
  }, [open, agent, form]);

  const createMut = useMutation({
    mutationFn: (body: CreateAgentBody) => agentsApi.create(body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      message.success('Agent created');
      onClose();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (body: UpdateAgentBody) => agentsApi.update(agent!.agentId, body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      message.success('Agent updated');
      onClose();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const submit = (v: FormValues) => {
    if (isEdit) {
      updateMut.mutate({
        firstName:          v.firstName,
        lastName:           v.lastName,
        email:              v.email,
        phone:              v.phone || undefined,
        role:               canEditRole ? v.role : undefined,
        isActive:           v.isActive,
        maxConcurrentCases: v.maxConcurrentCases,
      });
    } else {
      createMut.mutate({
        employeeNumber:     v.employeeNumber,
        firstName:          v.firstName,
        lastName:           v.lastName,
        email:              v.email,
        phone:              v.phone || undefined,
        role:               v.role,
        hireDate:           v.hireDate,
        maxConcurrentCases: v.maxConcurrentCases,
      });
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit ${agent.firstName} ${agent.lastName}` : 'Add agent'}
      okText={isEdit ? 'Save' : 'Create'}
      onOk={() => form.submit()}
      onCancel={onClose}
      confirmLoading={createMut.isPending || updateMut.isPending}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="firstName" label="First name" rules={[{ required: true }]} style={{ flex: 1, marginRight: 8 }}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last name" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="employeeNumber" label="Employee #"
                     rules={[{ required: !isEdit }]}
                     style={{ flex: 1, marginRight: 8 }}>
            <Input disabled={isEdit} />
          </Form.Item>
          <Form.Item name="phone" label="Phone" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space.Compact>

        <Space.Compact style={{ width: '100%' }}>
          <Form.Item name="role" label="Role" rules={[{ required: true }]} style={{ flex: 1, marginRight: 8 }}>
            <Select
              options={ROLES.map(r => ({ value: r, label: r }))}
              disabled={!canEditRole}
            />
          </Form.Item>
          <Form.Item name="maxConcurrentCases" label="Capacity" rules={[{ required: true }]} style={{ flex: 1 }}>
            <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="cases" />
          </Form.Item>
        </Space.Compact>

        {!isEdit && (
          <Form.Item name="hireDate" label="Hire date" tooltip="Optional, format YYYY-MM-DD">
            <Input placeholder="2025-01-15" />
          </Form.Item>
        )}

        {isEdit && (
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
