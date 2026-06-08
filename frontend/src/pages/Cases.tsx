import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Input, Segmented, Select, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { casesApi } from '@/api/cases';
import { agentsApi } from '@/api/employees';
import { CaseCard } from '@/components/kanban/CaseCard';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { CaseDrawer } from '@/components/CaseDrawer';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Agent, Case, CasePriority, CaseStatus } from '@/types/api';

const { Title, Text } = Typography;

const PRIORITIES: CasePriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

interface KanbanColumnSpec {
  key:       string;
  title:     string;
  tone:      'default' | 'amber' | 'red' | 'green' | 'blue';
  /** Statuses that flow into this column. */
  statuses:  CaseStatus[];
}

const COLUMNS: KanbanColumnSpec[] = [
  { key: 'new',       title: 'New',                tone: 'blue',    statuses: ['NEW']                       },
  { key: 'open',      title: 'In progress',        tone: 'default', statuses: ['OPEN', 'REOPENED']          },
  { key: 'pending',   title: 'Waiting',            tone: 'default', statuses: ['PENDING', 'ON_HOLD']        },
  { key: 'approval',  title: 'Awaiting approval',  tone: 'amber',   statuses: ['PENDING_APPROVAL']          },
  { key: 'escalated', title: 'Escalated',          tone: 'red',     statuses: ['ESCALATED']                 },
  { key: 'done',      title: 'Resolved',           tone: 'green',   statuses: ['RESOLVED', 'CLOSED']        },
];

type Scope = 'all' | 'mine' | 'unassigned';

export function Cases() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [scope,     setScope]     = useState<Scope>(me.isAgent ? 'mine' : 'all');
  const [priority,  setPriority]  = useState<CasePriority | undefined>();
  const [agentId,   setAgentId]   = useState<string | undefined>();
  const [search,    setSearch]    = useState('');

  const casesQ = useQuery({
    queryKey: ['cases', 'kanban', { priority, agentId }],
    queryFn:  () => casesApi.list({ size: 500, page: 0, priority, assignedAgentId: agentId }),
    placeholderData: prev => prev,
    refetchInterval: 30_000,
  });

  const agentsQ = useQuery({ queryKey: ['agents'], queryFn: () => agentsApi.list() });
  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    agentsQ.data?.forEach(a => m.set(a.agentId, a));
    return m;
  }, [agentsQ.data]);

  const claimMut = useMutation({
    mutationFn: (caseId: string) => casesApi.assign(caseId, { assignedAgentId: me.agentId! }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['cases'] }); message.success('Case claimed'); },
    onError:    (e: Error) => message.error(e.message),
  });

  const filtered = useMemo(() => {
    const all = casesQ.data?.content ?? [];
    const q   = search.trim().toLowerCase();
    return all.filter(c => {
      if (scope === 'mine'       && c.assignedAgentId !== me.agentId) return false;
      if (scope === 'unassigned' && c.assignedAgentId)                return false;
      if (q) {
        const subjectHit = c.subject.toLowerCase().includes(q);
        const numberHit  = String(c.caseNumber ?? '').includes(q);
        if (!subjectHit && !numberHit) return false;
      }
      return true;
    });
  }, [casesQ.data, scope, search, me.agentId]);

  const grouped = useMemo(() => {
    const map: Record<string, Case[]> = {};
    COLUMNS.forEach(col => { map[col.key] = []; });
    for (const c of filtered) {
      const col = COLUMNS.find(col => col.statuses.includes(c.status));
      if (col) map[col.key].push(c);
    }
    return map;
  }, [filtered]);

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span className="eyebrow">Inbox</span>
          <Title level={1} style={{ marginTop: 4, marginBottom: 0 }}>Cases</Title>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {filtered.length} of {casesQ.data?.totalElements ?? 0} cases
        </Text>
      </div>

      <Space wrap size="middle" style={{ marginBottom: 16 }}>
        <Segmented<Scope>
          value={scope}
          onChange={v => setScope(v as Scope)}
          options={[
            { label: 'All',         value: 'all' },
            { label: 'My cases',    value: 'mine',       disabled: !me.agentId },
            { label: 'Unassigned',  value: 'unassigned' },
          ]}
        />

        <Input
          placeholder="Search subject or #"
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240 }}
        />

        <Select<CasePriority | undefined>
          allowClear
          placeholder="Priority"
          value={priority}
          onChange={setPriority}
          options={PRIORITIES.map(p => ({ value: p, label: p }))}
          style={{ minWidth: 140 }}
        />

        {me.canSeeTeam && (
          <Select<string | undefined>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Agent"
            value={agentId}
            onChange={setAgentId}
            options={agentsQ.data?.map(a => ({
              value: a.agentId,
              label: `${a.firstName} ${a.lastName}`,
            })) ?? []}
            style={{ minWidth: 200 }}
          />
        )}

      </Space>

      <div style={{
        flex: 1,
        display: 'flex',
        gap: 14,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {COLUMNS.map(col => (
          <KanbanColumn key={col.key} title={col.title} count={grouped[col.key].length} tone={col.tone}>
            {grouped[col.key].map(c => (
              <CaseCard
                key={c.caseId}
                case={c}
                agent={c.assignedAgentId ? agentMap.get(c.assignedAgentId) : undefined}
                canClaim={!!me.agentId && (me.isAgent || me.isLead)}
                onClick={() => setActiveId(c.caseId)}
                onClaim={() => claimMut.mutate(c.caseId)}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>

      <CaseDrawer caseId={activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}
