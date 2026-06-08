import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App, Avatar, Button, Card, Col, Popconfirm, Row, Select, Space, Spin, Table, Tag, Typography,
} from 'antd';
import { EditOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { agentsApi, departmentsApi } from '@/api/employees';
import { AgentFormModal } from '@/components/AgentFormModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Agent } from '@/types/api';
import { fmtDate } from '@/lib/format';

const { Title } = Typography;

const ALL_DEPARTMENTS = '__all__';

export function Employees() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const [adminFilter, setAdminFilter] = useState<string>(ALL_DEPARTMENTS);
  const [editing,     setEditing]     = useState<Agent | null>(null);
  const [creating,    setCreating]    = useState(false);

  const departmentId = me.isAdmin && adminFilter !== ALL_DEPARTMENTS ? adminFilter : undefined;

  const agentsQ = useQuery({
    queryKey: ['agents', { departmentId }],
    queryFn:  () => agentsApi.list(departmentId),
  });

  const deptsQ = useQuery({
    queryKey: ['departments'],
    queryFn:  () => departmentsApi.list(),
    enabled:  me.isAdmin,
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => agentsApi.deactivate(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      message.success('Agent deactivated');
    },
    onError: (e: Error) => message.error(e.message),
  });

  const canManage = me.isAdmin || me.isLead;

  const columns: ColumnsType<Agent> = [
    {
      title: '#',
      dataIndex: 'employeeNumber',
      width: 90,
      render: n => <span className="mono" style={{ color: '#52525b' }}>{n}</span>,
    },
    {
      title: 'Name',
      render: (_, a) => (
        <Space>
          <Avatar size="small" style={{ background: '#27272a', fontSize: 12 }}>
            {a.firstName[0]}{a.lastName[0]}
          </Avatar>
          <span style={{ fontWeight: 500 }}>{a.firstName} {a.lastName}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      render: e => <span className="mono" style={{ fontSize: 12, color: '#52525b' }}>{e}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      width: 140,
      render: role => <Tag>{role}</Tag>,
    },
    {
      title: 'Hire date',
      dataIndex: 'hireDate',
      width: 130,
      render: d => <span className="mono" style={{ fontSize: 12 }}>{fmtDate(d)}</span>,
    },
    {
      title: 'Capacity',
      dataIndex: 'maxConcurrentCases',
      width: 110,
      align: 'right',
      render: n => <span className="mono">{n} cases</span>,
    },
    ...(canManage ? [{
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_: unknown, a: Agent) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => setEditing(a)}>
            Edit
          </Button>
          {me.isAdmin && (
            <Popconfirm
              title="Deactivate agent?"
              description="They'll be hidden from the active roster. Existing cases stay assigned."
              okText="Deactivate"
              okButtonProps={{ danger: true }}
              onConfirm={() => deactivateMut.mutate(a.agentId)}
            >
              <Button size="small" type="text" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    }] : []),
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span className="eyebrow">Roster</span>
          <Title level={1} style={{ marginTop: 4, marginBottom: 0 }}>Employees</Title>
        </div>
        <Space size="middle">
          {me.isAdmin && (
            <Space size="small">
              <span style={{ fontSize: 12, color: '#71717a' }}>Department</span>
              <Select
                value={adminFilter}
                onChange={setAdminFilter}
                style={{ minWidth: 220 }}
                options={[
                  { value: ALL_DEPARTMENTS, label: 'All departments' },
                  ...(deptsQ.data?.map(d => ({ value: d.departmentId, label: d.name })) ?? []),
                ]}
              />
            </Space>
          )}
          {me.isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
              Add agent
            </Button>
          )}
        </Space>
      </div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="1">
          <Card>
            <span className="eyebrow">Active agents</span>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>
              {agentsQ.data?.length ?? 0}
            </div>
          </Card>
        </Col>
        <Col flex="1">
          <Card>
            <span className="eyebrow">Average capacity</span>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>
              {agentsQ.data?.length
                ? Math.round(agentsQ.data.reduce((s, a) => s + a.maxConcurrentCases, 0) / agentsQ.data.length)
                : 0} <span style={{ fontSize: 14, color: '#71717a' }}>cases / agent</span>
            </div>
          </Card>
        </Col>
      </Row>
      <Card styles={{ body: { padding: 0 } }}>
        {agentsQ.isLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}><Spin /></div>
        ) : (
          <Table<Agent>
            columns={columns}
            dataSource={agentsQ.data ?? []}
            rowKey="agentId"
            pagination={false}
            size="middle"
          />
        )}
      </Card>

      <AgentFormModal
        open={creating}
        onClose={() => setCreating(false)}
      />
      <AgentFormModal
        open={!!editing}
        agent={editing}
        canEditRole={me.isAdmin}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
