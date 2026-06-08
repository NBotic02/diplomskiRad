import { api } from './client';
import type { AgentPerformance, Bottleneck, DailyMetric } from '@/types/api';

export const metricsApi = {
  daily: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to)   qs.set('to', to);
    return api.get<DailyMetric[]>(`/api/v1/metrics/daily?${qs.toString()}`);
  },
  /** Today's per-agent snapshot (DAILY). */
  agentToday: async (agentId: string): Promise<AgentPerformance | null> => {
    const res = await api.get<AgentPerformance | undefined>(
      `/api/v1/metrics/agents/${agentId}/today`);
    return res ?? null;
  },
  /** Per-agent history for the chosen period type. */
  agentHistory: (agentId: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY') =>
    api.get<AgentPerformance[]>(`/api/v1/metrics/agents/${agentId}?period=${period}`),
};

export const bottlenecksApi = {
  list:    (unresolvedOnly = true) => api.get<Bottleneck[]>(`/api/v1/bottlenecks?unresolvedOnly=${unresolvedOnly}`),
  resolve: (id: string)            => api.post<Bottleneck>(`/api/v1/bottlenecks/${id}/resolve`),
};
