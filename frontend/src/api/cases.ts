import { api } from './client';
import type {
  Case, CaseCategory, CasePriority, CaseStatus,
  Communication, Customer, Note, PageResponse, SlaTracking, SenderType,
} from '@/types/api';

export interface CaseFilters {
  status?: CaseStatus;
  priority?: CasePriority;
  assignedAgentId?: string;
  page?: number;
  size?: number;
}

export const casesApi = {
  list: (filters: CaseFilters = {}) => {
    const qs = new URLSearchParams();
    if (filters.status)          qs.set('status', filters.status);
    if (filters.priority)        qs.set('priority', filters.priority);
    if (filters.assignedAgentId) qs.set('assignedAgentId', filters.assignedAgentId);
    qs.set('page', String(filters.page ?? 0));
    qs.set('size', String(filters.size ?? 25));
    qs.set('sort', 'createdAt,desc');
    return api.get<PageResponse<Case>>(`/api/v1/cases?${qs.toString()}`);
  },
  get:        (id: string) => api.get<Case>(`/api/v1/cases/${id}`),
  sla:        (id: string) => api.get<SlaTracking>(`/api/v1/cases/${id}/sla`),
  comms:      (id: string) => api.get<Communication[]>(`/api/v1/cases/${id}/communications`),
  notes:      (id: string) => api.get<Note[]>(`/api/v1/cases/${id}/notes`),

  create:     (body: { customerId: string; subject: string; description?: string; priority?: CasePriority; categoryId?: number }) =>
                api.post<Case>('/api/v1/cases', body),
  assign:     (id: string, body: { assignedAgentId: string; teamId?: string }) =>
                api.patch<Case>(`/api/v1/cases/${id}/assign`, body),
  updateStatus: (id: string, body: { status: CaseStatus; changeReason?: string }) =>
                api.post<Case>(`/api/v1/cases/${id}/status`, body),
  addComm:    (id: string, body: { senderType: SenderType; senderId: string; subject?: string; body: string;
                                   to?: string; cc?: string[] }) =>
                api.post<Communication>(`/api/v1/cases/${id}/communications`, body),
  addNote:    (id: string, body: { authorId: string; content: string; isPinned?: boolean }) =>
                api.post<Note>(`/api/v1/cases/${id}/notes`, body),
};

export const customersApi = {
  byEmail:    (email: string) => api.get<Customer>(`/api/v1/customers?email=${encodeURIComponent(email)}`),
  get:        (id: string)    => api.get<Customer>(`/api/v1/customers/${id}`),
  create:     (body: { firstName: string; lastName: string; email: string; phone?: string; company?: string; tier?: string }) =>
                api.post<Customer>('/api/v1/customers', body),
};

export const categoriesApi = {
  list: () => api.get<CaseCategory[]>('/api/v1/case-categories'),
};

/** Cases-by-category and cases-by-priority breakdown for a period. */
export interface CaseBreakdown {
  casesByCategory: Record<string, number>;
  casesByPriority: Record<string, number>;
}

export const caseBreakdownApi = {
  fetch: (from: string, to: string, agentIds?: string[]) => {
    const qs = new URLSearchParams({ from, to });
    (agentIds ?? []).forEach(id => qs.append('agentIds', id));
    return api.get<CaseBreakdown>(`/api/v1/cases/breakdown?${qs.toString()}`);
  },
};
