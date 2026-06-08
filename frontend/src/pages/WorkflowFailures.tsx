import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Alert, Button, Card, Col, Drawer, Empty, Input, Row, Segmented,
  Space, Spin, Table, Tag, Tooltip, Typography,
} from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { workflowFailuresApi } from '@/api/workflowFailures';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import type { WorkflowFailure } from '@/types/api';

const { Title, Text, Paragraph } = Typography;

const RANGE_OPTIONS = [
  { label: '24 h',  value: 1   },
  { label: '7 d',   value: 7   },
  { label: '30 d',  value: 30  },
  { label: '90 d',  value: 90  },
];

/** Admin view of orchestrator failures, with row drill-down. */
export function WorkflowFailures() {
  const [days,    setDays]    = useState<number>(7);
  const [search,  setSearch]  = useState('');
  const [open,    setOpen]    = useState<WorkflowFailure | null>(null);

  const q = useQuery({
    queryKey: ['workflow-failures', { days }],
    queryFn:  () => workflowFailuresApi.recent(days),
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    if (!q.data) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return q.data;
    return q.data.filter(f =>
      (f.workflowName ?? '').toLowerCase().includes(needle) ||
      (f.failedNode   ?? '').toLowerCase().includes(needle) ||
      (f.errorMessage ?? '').toLowerCase().includes(needle) ||
      (f.n8nExecutionId ?? '').toLowerCase().includes(needle),
    );
  }, [q.data, search]);

  const summary = useMemo(() => {
    const total       = q.data?.length ?? 0;
    const uncompensated = q.data?.filter(f => !f.compensated).length ?? 0;
    const withCase    = q.data?.filter(f => f.caseId).length ?? 0;
    return { total, uncompensated, withCase };
  }, [q.data]);

  const columns: ColumnsType<WorkflowFailure> = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      width: 200,
      render: iso => (
        <Tooltip title={fmtDateTime(iso)}>
          <span className="mono" style={{ fontSize: 12 }}>{fmtRelative(iso)}</span>
        </Tooltip>
      ),
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Workflow',
      dataIndex: 'workflowName',
      render: name => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Failed node',
      dataIndex: 'failedNode',
      render: node => <Tag color="red">{node}</Tag>,
    },
    {
      title: 'Error',
      dataIndex: 'errorMessage',
      ellipsis: { showTitle: false },
      render: msg => (
        <Tooltip title={msg}>
          <span style={{ color: '#52525b', fontSize: 12 }}>{msg ?? '—'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Case',
      dataIndex: 'caseId',
      width: 130,
      render: id => id
        ? (
          <Link
            to={`/cases/${id}`}
            onClick={e => e.stopPropagation()}
            className="mono"
            style={{ fontSize: 12 }}
          >
            {id.slice(0, 8)}…
          </Link>
        )
        : <span style={{ color: '#a1a1aa' }}>—</span>,
    },
    {
      title: 'Status',
      dataIndex: 'compensated',
      width: 140,
      render: c => c
        ? <Tag color="green">Compensated</Tag>
        : <Tag color="gold">Uncompensated</Tag>,
      filters: [
        { text: 'Compensated',    value: true  },
        { text: 'Uncompensated',  value: false },
      ],
      onFilter: (val, row) => row.compensated === val,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span className="eyebrow">Orchestrator</span>
          <Title level={1} style={{ marginTop: 4, marginBottom: 0 }}>Workflow failures</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Every failed node in the n8n pipeline lands here. Drill into a row for the inbound payload and full error.
          </Text>
        </div>
        <Space size="middle">
          <Segmented
            options={RANGE_OPTIONS}
            value={days}
            onChange={v => setDays(v as number)}
          />
          <Button icon={<ReloadOutlined />} onClick={() => q.refetch()}>Refresh</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="1">
          <Card>
            <span className="eyebrow">Total</span>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{summary.total}</div>
          </Card>
        </Col>
        <Col flex="1">
          <Card>
            <span className="eyebrow">Uncompensated</span>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: summary.uncompensated ? '#b45309' : undefined }}>
              {summary.uncompensated}
            </div>
          </Card>
        </Col>
        <Col flex="1">
          <Card>
            <span className="eyebrow">Attached to a case</span>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{summary.withCase}</div>
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Filter by workflow, node, error, execution id…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 480 }}
          />
        </div>
        {q.isLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}><Spin /></div>
        ) : q.isError ? (
          <div style={{ padding: 16 }}>
            <Alert type="error" message="Couldn't load workflow failures" description={String(q.error)} />
          </div>
        ) : (
          <Table<WorkflowFailure>
            columns={columns}
            dataSource={rows}
            rowKey="failureId"
            size="middle"
            pagination={{ pageSize: 25, showSizeChanger: false }}
            onRow={row => ({ onClick: () => setOpen(row), style: { cursor: 'pointer' } })}
            locale={{ emptyText: <Empty description="No failures in this period — nothing to triage." /> }}
          />
        )}
      </Card>

      <FailureDrawer failure={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/** Side drawer with the full failure record and JSON payloads. */
function FailureDrawer({ failure, onClose }: { failure: WorkflowFailure | null; onClose: () => void }) {
  return (
    <Drawer
      open={!!failure}
      onClose={onClose}
      width={640}
      title={failure ? (
        <Space direction="vertical" size={0}>
          <Text strong>{failure.workflowName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Failed at node <Tag color="red">{failure.failedNode}</Tag>
            {' · '}{fmtDateTime(failure.createdAt)}
          </Text>
        </Space>
      ) : null}
    >
      {failure && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <MetadataRow label="Failure ID"     value={failure.failureId} mono />
          <MetadataRow label="n8n execution"  value={failure.n8nExecutionId ?? '—'} mono />
          <MetadataRow
            label="Case"
            value={failure.caseId
              ? <Link to={`/cases/${failure.caseId}`}>{failure.caseId}</Link>
              : <span style={{ color: '#a1a1aa' }}>(failure occurred before a case was created)</span>}
          />
          {failure.caseStatusBefore && (
            <MetadataRow label="Case status before failure" value={<Tag>{failure.caseStatusBefore}</Tag>} />
          )}
          <MetadataRow
            label="Compensation"
            value={failure.compensated
              ? <Tag color="green">Compensated — case-service rolled the case back</Tag>
              : <Tag color="gold">Not compensated</Tag>}
          />

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>Error message</Text>
            <Paragraph style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 10, marginBottom: 0, color: '#991b1b' }}>
              {failure.errorMessage ?? '(no message)'}
            </Paragraph>
          </div>

          <JsonBlock label="Error payload"   value={failure.errorPayload} />
          <JsonBlock label="Inbound payload" value={failure.inboundPayload} />
        </Space>
      )}
    </Drawer>
  );
}

function MetadataRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <span className="eyebrow" style={{ display: 'block', marginBottom: 2 }}>{label}</span>
      <span className={mono ? 'mono' : undefined} style={{ fontSize: 13 }}>{value}</span>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  if (!value || Object.keys(value).length === 0) return null;
  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 6 }}>{label}</Text>
      <pre style={{
        background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 6,
        padding: 10, margin: 0, fontSize: 12, maxHeight: 320, overflow: 'auto',
      }}>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
