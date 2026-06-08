import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App, Avatar, Button, Card, Col, Descriptions, Divider, Empty, Form,
  Input, Modal, Row, Select, Space, Spin, Tag, Timeline, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, MessageOutlined, PushpinFilled,
  PushpinOutlined, ClockCircleOutlined,
} from '@ant-design/icons';

import { casesApi, customersApi } from '@/api/cases';
import { agentsApi } from '@/api/employees';
import { StatusTag } from '@/components/StatusTag';
import { fmtDateTime, fmtRelative, shortId } from '@/lib/format';
import type { CaseStatus, SenderType } from '@/types/api';

const { Title, Text, Paragraph } = Typography;

const STATUSES: CaseStatus[] = ['NEW','OPEN','PENDING','ON_HOLD','ESCALATED','RESOLVED','CLOSED','REOPENED'];
const SYSTEM_USER = '00000000-0000-0000-0000-000000000001';

export function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const { message } = App.useApp();

  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [commOpen,   setCommOpen]   = useState(false);
  const [noteOpen,   setNoteOpen]   = useState(false);

  const caseQ      = useQuery({ queryKey: ['case', caseId],          queryFn: () => casesApi.get(caseId!), enabled: !!caseId });
  const slaQ       = useQuery({ queryKey: ['case', caseId, 'sla'],   queryFn: () => casesApi.sla(caseId!), enabled: !!caseId, retry: false });
  const commsQ     = useQuery({ queryKey: ['case', caseId, 'comms'], queryFn: () => casesApi.comms(caseId!), enabled: !!caseId });
  const notesQ     = useQuery({ queryKey: ['case', caseId, 'notes'], queryFn: () => casesApi.notes(caseId!), enabled: !!caseId });
  const agentsQ    = useQuery({ queryKey: ['agents'],                queryFn: () => agentsApi.list() });
  const customerQ  = useQuery({
    queryKey: ['customer', caseQ.data?.customerId],
    queryFn:  () => customersApi.get(caseQ.data!.customerId),
    enabled:  !!caseQ.data?.customerId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['case', caseId] });

  const assignMut = useMutation({
    mutationFn: (agentId: string) => casesApi.assign(caseId!, { assignedAgentId: agentId }),
    onSuccess:  () => { invalidate(); setAssignOpen(false); message.success('Agent assigned'); },
    onError:    (e: Error) => message.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (body: { status: CaseStatus; changeReason?: string }) => casesApi.updateStatus(caseId!, body),
    onSuccess:  () => { invalidate(); setStatusOpen(false); message.success('Status updated'); },
    onError:    (e: Error) => message.error(e.message),
  });

  const commMut = useMutation({
    mutationFn: (body: { subject?: string; body: string; to: string; cc?: string[] }) =>
      casesApi.addComm(caseId!, {
        senderType: 'AGENT',
        senderId:   SYSTEM_USER,
        ...body,
      }),
    onSuccess:  () => { invalidate(); setCommOpen(false); message.success('Reply sent to customer'); },
    onError:    (e: Error) => message.error(e.message),
  });

  const noteMut = useMutation({
    mutationFn: (body: { content: string; isPinned?: boolean }) =>
      casesApi.addNote(caseId!, { ...body, authorId: SYSTEM_USER }),
    onSuccess:  () => { invalidate(); setNoteOpen(false); message.success('Note added'); },
    onError:    (e: Error) => message.error(e.message),
  });

  if (caseQ.isLoading) return <div style={{ display: 'grid', placeItems: 'center', height: 320 }}><Spin /></div>;
  if (!caseQ.data)     return <Empty description="Case not found" />;

  const c       = caseQ.data;
  const agent   = agentsQ.data?.find(a => a.agentId === c.assignedAgentId);
  const cust    = customerQ.data;
  const pinned  = (notesQ.data ?? []).filter(n => n.isPinned);
  const others  = (notesQ.data ?? []).filter(n => !n.isPinned);

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 8 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/cases')}>
          Back to inbox
        </Button>
      </Space>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <div>
          <Space>
            <Text className="mono" type="secondary">#{c.caseNumber ?? shortId(c.caseId)}</Text>
            <StatusTag variant="priority" value={c.priority} />
            <StatusTag variant="status"   value={c.status} />
          </Space>
          <Title level={2} style={{ margin: '4px 0 0' }}>{c.subject}</Title>
        </div>
        <Space>
          <Button onClick={() => setAssignOpen(true)}>
            {c.assignedAgentId ? 'Reassign' : 'Assign agent'}
          </Button>
          <Button type="primary" onClick={() => setStatusOpen(true)}>
            Change status
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Conversation"
                extra={<Button size="small" icon={<MessageOutlined />} onClick={() => setCommOpen(true)}>Add</Button>}
                styles={{ body: { padding: 16 } }}>
            {commsQ.data?.length ? (
              <Timeline
                items={commsQ.data.map(comm => ({
                  dot: <Avatar size="small" style={{ background: senderColor(comm.senderType) }}>
                          {comm.senderType[0]}
                       </Avatar>,
                  children: (
                    <div style={{ marginInlineStart: 8 }}>
                      <Space size="small" style={{ marginBottom: 4 }}>
                        <Tag style={{ marginInlineEnd: 0 }}>{comm.senderType}</Tag>
                        <Text className="mono" type="secondary" style={{ fontSize: 11 }}>
                          {fmtDateTime(comm.createdAt)}
                        </Text>
                      </Space>
                      {comm.subject && <div style={{ fontWeight: 500 }}>{comm.subject}</div>}
                      <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{comm.body}</Paragraph>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No messages yet" />
            )}
          </Card>

          <Card title={`Internal notes${notesQ.data?.length ? ` (${notesQ.data.length})` : ''}`}
                extra={<Button size="small" onClick={() => setNoteOpen(true)}>Add note</Button>}
                style={{ marginTop: 16 }}
                styles={{ body: { padding: 0 } }}>
            {(pinned.length + others.length) === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notes" style={{ padding: 32 }} />
            ) : (
              <div>
                {pinned.map(n => (
                  <div key={n.noteId} style={{ padding: 12, borderBottom: '1px solid #f4f4f5',
                                                background: '#fffbeb' }}>
                    <Space size="small" style={{ marginBottom: 4 }}>
                      <PushpinFilled style={{ color: '#d97706' }} />
                      <Text className="mono" type="secondary" style={{ fontSize: 11 }}>
                        {fmtDateTime(n.createdAt)}
                      </Text>
                    </Space>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{n.content}</Paragraph>
                  </div>
                ))}
                {others.map(n => (
                  <div key={n.noteId} style={{ padding: 12, borderBottom: '1px solid #f4f4f5' }}>
                    <Space size="small" style={{ marginBottom: 4 }}>
                      <PushpinOutlined style={{ color: '#a1a1aa' }} />
                      <Text className="mono" type="secondary" style={{ fontSize: 11 }}>
                        {fmtDateTime(n.createdAt)}
                      </Text>
                    </Space>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{n.content}</Paragraph>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Metadata" styles={{ body: { padding: 0 } }}>
            <Descriptions column={1} bordered size="small"
                          labelStyle={{ width: 120, fontSize: 12, color: '#71717a' }}
                          contentStyle={{ fontSize: 12 }}>
              <Descriptions.Item label="Case ID">
                <Text className="mono" copyable>{c.caseId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {cust ? `${cust.firstName} ${cust.lastName}` : <Text className="mono" type="secondary">{shortId(c.customerId)}</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {cust?.email ? <Text className="mono" copyable>{cust.email}</Text> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tier">
                {cust?.tier ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Agent">
                {agent ? `${agent.firstName} ${agent.lastName}` : 'Unassigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Reopened">
                <Text className="mono">{c.reopenedCount}×</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                <Text className="mono" style={{ fontSize: 11 }}>{fmtDateTime(c.createdAt)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                <Text className="mono" style={{ fontSize: 11 }}>{fmtDateTime(c.updatedAt)}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="SLA" style={{ marginTop: 16 }}>
            {slaQ.data ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <StatusTag variant="sla" value={slaQ.data.slaStatus} />
                </div>
                <Descriptions column={1} size="small"
                              labelStyle={{ width: 120, fontSize: 12, color: '#71717a' }}
                              contentStyle={{ fontSize: 12 }}>
                  <Descriptions.Item label="First response">
                    <Text className="mono" style={{ fontSize: 11 }}>
                      <ClockCircleOutlined /> {fmtRelative(slaQ.data.responseDeadline)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Resolution">
                    <Text className="mono" style={{ fontSize: 11 }}>
                      <ClockCircleOutlined /> {fmtRelative(slaQ.data.resolutionDeadline)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No SLA tracking" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal title="Assign agent" open={assignOpen} onCancel={() => setAssignOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical"
              onFinish={({ agentId }: { agentId: string }) => assignMut.mutate(agentId)}>
          <Form.Item name="agentId" label="Agent" rules={[{ required: true }]}>
            <Select
              placeholder="Pick an agent"
              showSearch
              optionFilterProp="label"
              options={agentsQ.data?.map(a => ({
                value: a.agentId,
                label: `${a.firstName} ${a.lastName} · ${a.role}`,
              })) ?? []}
            />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={assignMut.isPending}>Assign</Button>
          </Space>
        </Form>
      </Modal>

      <Modal title="Change status" open={statusOpen} onCancel={() => setStatusOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical"
              initialValues={{ status: c.status }}
              onFinish={(v: { status: CaseStatus; changeReason: string }) => statusMut.mutate(v)}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUSES.map(s => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="changeReason" label="Change reason">
            <Input.TextArea rows={3} placeholder="Optional — shown in the case timeline" />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={statusMut.isPending}>Save</Button>
          </Space>
        </Form>
      </Modal>

      <Modal title="Reply to customer" open={commOpen} onCancel={() => setCommOpen(false)}
             footer={null} destroyOnClose width={560}>
        <Form
          layout="vertical"
          initialValues={{
            to: cust?.email ?? '',
            subject: c?.subject ? `Re: ${c.subject}` : '',
          }}
          onFinish={(v: { to: string; cc?: string; subject?: string; body: string }) => {
            const ccList = (v.cc ?? '')
              .split(/[,;]/)
              .map(s => s.trim())
              .filter(Boolean);
            commMut.mutate({
              to:      v.to.trim(),
              cc:      ccList.length ? ccList : undefined,
              subject: v.subject,
              body:    v.body,
            });
          }}
        >
          <div style={{
            background: '#fafafa', border: '1px solid #f4f4f5',
            borderRadius: 6, padding: '8px 12px', marginBottom: 12,
            fontSize: 12, color: '#52525b',
          }}>
            <Space size={6}>
              <MessageOutlined style={{ color: '#0ea5e9' }} />
              <span>From <Text className="mono" strong>support.csplatform@gmail.com</Text></span>
            </Space>
          </div>

          <Form.Item name="to" label="To" rules={[{ required: true, type: 'email',
                                                    message: 'Enter a valid email' }]}>
            <Input placeholder="customer@example.com" />
          </Form.Item>

          <Form.Item name="cc" label="CC"
                     tooltip="Comma-separated email addresses (optional)">
            <Input placeholder="lead@example.com, ops@example.com" />
          </Form.Item>

          <Form.Item name="subject" label="Subject">
            <Input placeholder="Re: …" />
          </Form.Item>

          <Form.Item name="body" label="Message" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="Your reply to the customer…" />
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setCommOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={commMut.isPending}>
              Send reply
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal title="Add internal note" open={noteOpen} onCancel={() => setNoteOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical"
              initialValues={{ isPinned: false }}
              onFinish={(v: { content: string; isPinned: boolean }) => noteMut.mutate(v)}>
          <Form.Item name="content" label="Note" rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder="Visible only to agents" />
          </Form.Item>
          <Form.Item name="isPinned" label="Pin to top" valuePropName="checked">
            <Select options={[{ value: false, label: 'No' }, { value: true, label: 'Yes — pin' }]} />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={noteMut.isPending}>Save</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

function senderColor(s: SenderType): string {
  return s === 'CUSTOMER' ? '#0ea5e9' : s === 'AGENT' ? '#18181b' : '#a1a1aa';
}
