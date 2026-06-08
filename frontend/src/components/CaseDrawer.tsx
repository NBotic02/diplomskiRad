import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App, Avatar, Button, Descriptions, Divider, Drawer, Empty, Form, Input,
  Modal, Select, Space, Spin, Tabs, Tag, Timeline, Tooltip, Typography,
} from 'antd';
import {
  ClockCircleOutlined, MessageOutlined, PushpinFilled, PushpinOutlined,
  SendOutlined, CheckOutlined, StopOutlined, UserAddOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';

import { casesApi, customersApi } from '@/api/cases';
import { agentsApi } from '@/api/employees';
import { StatusTag } from '@/components/StatusTag';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { fmtDateTime, fmtRelative, shortId } from '@/lib/format';
import type { Case, CaseStatus, SenderType } from '@/types/api';

const { Title, Text, Paragraph } = Typography;

const STATUSES: CaseStatus[] = [
  'NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'PENDING_APPROVAL',
  'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED',
];

const SYSTEM_USER = '00000000-0000-0000-0000-000000000001';

const modalActionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 16,
};

interface CaseDrawerProps {
  caseId:  string | null;
  onClose: () => void;
}

/** Side drawer with conversation, notes, metadata and SLA for a case. */
export function CaseDrawer({ caseId, onClose }: CaseDrawerProps) {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();

  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [commOpen,   setCommOpen]   = useState(false);
  const [noteOpen,   setNoteOpen]   = useState(false);

  const open = !!caseId;

  const caseQ      = useQuery({ queryKey: ['case', caseId],          queryFn: () => casesApi.get(caseId!),   enabled: open });
  const slaQ       = useQuery({ queryKey: ['case', caseId, 'sla'],   queryFn: () => casesApi.sla(caseId!),   enabled: open, retry: false });
  const commsQ     = useQuery({ queryKey: ['case', caseId, 'comms'], queryFn: () => casesApi.comms(caseId!), enabled: open });
  const notesQ     = useQuery({ queryKey: ['case', caseId, 'notes'], queryFn: () => casesApi.notes(caseId!), enabled: open });
  const agentsQ    = useQuery({ queryKey: ['agents'],                queryFn: () => agentsApi.list() });
  const customerQ  = useQuery({
    queryKey: ['customer', caseQ.data?.customerId],
    queryFn:  () => customersApi.get(caseQ.data!.customerId),
    enabled:  !!caseQ.data?.customerId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['case', caseId] });
    qc.invalidateQueries({ queryKey: ['cases'] });
  };

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
        senderId:   me.agentId ?? SYSTEM_USER,
        ...body,
      }),
    onSuccess:  () => { invalidate(); setCommOpen(false); message.success('Reply sent to customer'); },
    onError:    (e: Error) => message.error(e.message),
  });

  const noteMut = useMutation({
    mutationFn: (body: { content: string; isPinned?: boolean }) =>
      casesApi.addNote(caseId!, { ...body, authorId: me.agentId ?? SYSTEM_USER }),
    onSuccess:  () => { invalidate(); setNoteOpen(false); message.success('Note added'); },
    onError:    (e: Error) => message.error(e.message),
  });

  const claimMut = useMutation({
    mutationFn: () => casesApi.assign(caseId!, { assignedAgentId: me.agentId! }),
    onSuccess:  () => { invalidate(); message.success('Case claimed'); },
    onError:    (e: Error) => message.error(e.message),
  });

  const c = caseQ.data;
  const agent  = agentsQ.data?.find(a => a.agentId === c?.assignedAgentId);
  const cust   = customerQ.data;
  const pinned = (notesQ.data ?? []).filter(n => n.isPinned);
  const others = (notesQ.data ?? []).filter(n => !n.isPinned);

  const isMine    = c?.assignedAgentId && c.assignedAgentId === me.agentId;
  const canClaim  = !!c && !c.assignedAgentId && !!me.agentId
                    && (me.isAgent || me.isLead);
  const canSubmit = !!c && isMine && (c.status === 'OPEN' || c.status === 'REOPENED');
  const canDecide = !!c && c.status === 'PENDING_APPROVAL'
                    && (me.isLead || me.isAdmin);

  const submitForApproval = () => {
    modal.confirm({
      title: 'Submit for approval?',
      content: 'The department lead will be asked to approve closing this case before the customer is notified.',
      okText: 'Submit',
      onOk: () => statusMut.mutateAsync({ status: 'PENDING_APPROVAL', changeReason: 'Agent submitted for approval' }),
    });
  };

  const approve = () => {
    modal.confirm({
      title: 'Approve resolution?',
      content: 'The case will move to RESOLVED and the customer-facing reply will be sent.',
      okText: 'Approve',
      onOk: () => statusMut.mutateAsync({ status: 'RESOLVED', changeReason: 'Approved by lead' }),
    });
  };

  const reject = () => {
    let reason = '';
    modal.confirm({
      title: 'Reject and send back?',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Why are you sending it back? (visible to the agent)"
          onChange={e => { reason = e.target.value; }}
        />
      ),
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: () => statusMut.mutateAsync({
        status: 'OPEN',
        changeReason: reason || 'Rejected by lead — needs revision',
      }),
    });
  };

  return (
    <Drawer
      open={open}
      width={760}
      onClose={onClose}
      destroyOnClose
      title={c ? (
        <Space size="middle" align="center">
          <Text className="mono" type="secondary">#{c.caseNumber ?? shortId(c.caseId)}</Text>
          <StatusTag variant="priority" value={c.priority} />
          <StatusTag variant="status"   value={c.status} />
        </Space>
      ) : 'Case'}
      extra={c && (
        <Space size="small">
          {canClaim && (
            <Button icon={<UserAddOutlined />} loading={claimMut.isPending} onClick={() => claimMut.mutate()}>
              Claim
            </Button>
          )}
          {canSubmit && (
            <Button icon={<SendOutlined />} type="primary" onClick={submitForApproval}>
              Submit for approval
            </Button>
          )}
          {canDecide && (
            <>
              <Button danger icon={<StopOutlined />} onClick={reject}>Reject</Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={approve}>Approve</Button>
            </>
          )}
          <Button onClick={() => setAssignOpen(true)}>
            {c.assignedAgentId ? 'Reassign' : 'Assign'}
          </Button>
          {(me.isAdmin || me.isLead) && (
            <Button onClick={() => setStatusOpen(true)}>Status</Button>
          )}
          <Tooltip title="Open full page">
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={() => {
                onClose();
                navigate(`/cases/${c.caseId}`);
              }}
            />
          </Tooltip>
        </Space>
      )}
    >
      {!c ? (
        <div style={{ display: 'grid', placeItems: 'center', height: 240 }}>
          {caseQ.isLoading ? <Spin /> : <Empty description="Case not found" />}
        </div>
      ) : (
        <>
          <Title level={4} style={{ marginTop: 0 }}>{c.subject}</Title>
          {c.description && (
            <Paragraph style={{ whiteSpace: 'pre-wrap', color: '#3f3f46' }}>{c.description}</Paragraph>
          )}

          <Tabs
            defaultActiveKey="conversation"
            items={[
              {
                key: 'conversation',
                label: 'Conversation',
                children: (
                  <>
                    <Space style={{ marginBottom: 12 }}>
                      <Button size="small" icon={<MessageOutlined />} onClick={() => setCommOpen(true)}>
                        Add message
                      </Button>
                    </Space>
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
                  </>
                ),
              },
              {
                key: 'notes',
                label: `Internal notes${notesQ.data?.length ? ` (${notesQ.data.length})` : ''}`,
                children: (
                  <>
                    <Space style={{ marginBottom: 12 }}>
                      <Button size="small" onClick={() => setNoteOpen(true)}>Add note</Button>
                    </Space>
                    {(pinned.length + others.length) === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notes" />
                    ) : (
                      <div>
                        {pinned.map(n => (
                          <div key={n.noteId} style={{
                            padding: 12, marginBottom: 8, borderRadius: 8,
                            background: '#fffbeb', border: '1px solid #fde68a',
                          }}>
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
                          <div key={n.noteId} style={{
                            padding: 12, marginBottom: 8, borderRadius: 8,
                            border: '1px solid #e4e4e7',
                          }}>
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
                  </>
                ),
              },
              {
                key: 'meta',
                label: 'Details',
                children: (
                  <>
                    <Descriptions column={1} bordered size="small"
                                  labelStyle={{ width: 140, fontSize: 12, color: '#71717a' }}
                                  contentStyle={{ fontSize: 12 }}>
                      <Descriptions.Item label="Customer">
                        {cust ? `${cust.firstName} ${cust.lastName}` : <Text className="mono" type="secondary">{shortId(c.customerId)}</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {cust?.email ? <Text className="mono" copyable>{cust.email}</Text> : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tier">{cust?.tier ?? '—'}</Descriptions.Item>
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

                    <Divider orientation="left" plain style={{ margin: '24px 0 12px', fontSize: 12, color: '#71717a' }}>
                      SLA
                    </Divider>
                    {slaQ.data ? (
                      <>
                        <div style={{ marginBottom: 12 }}>
                          <StatusTag variant="sla" value={slaQ.data.slaStatus} />
                        </div>
                        <Descriptions column={1} size="small"
                                      labelStyle={{ width: 140, fontSize: 12, color: '#71717a' }}
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
                  </>
                ),
              },
            ]}
          />
        </>
      )}

      <Modal title="Assign agent" open={assignOpen} onCancel={() => setAssignOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" onFinish={({ agentId }: { agentId: string }) => assignMut.mutate(agentId)}>
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
          <div style={modalActionsStyle}>
            <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={assignMut.isPending}>Assign</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="Change status" open={statusOpen} onCancel={() => setStatusOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical"
              initialValues={{ status: c?.status }}
              onFinish={(v: { status: CaseStatus; changeReason: string }) => statusMut.mutate(v)}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUSES.map(s => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="changeReason" label="Change reason">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div style={modalActionsStyle}>
            <Button onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={statusMut.isPending}>Save</Button>
          </div>
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

          <div style={modalActionsStyle}>
            <Button onClick={() => setCommOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={commMut.isPending}>
              Send reply
            </Button>
          </div>
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
          <div style={modalActionsStyle}>
            <Button onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={noteMut.isPending}>Save</Button>
          </div>
        </Form>
      </Modal>
    </Drawer>
  );
}

function senderColor(s: SenderType): string {
  return s === 'CUSTOMER' ? '#0ea5e9' : s === 'AGENT' ? '#18181b' : '#a1a1aa';
}
