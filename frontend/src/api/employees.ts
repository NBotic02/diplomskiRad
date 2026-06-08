import { api } from './client';
import type {
  Agent, AgentRole, AgentSchedule, AgentSkill, Department, Shift, Skill,
  ScheduleException, ScheduleExceptionType,
} from '@/types/api';

export interface CreateAgentBody {
  employeeNumber:     string;
  firstName:          string;
  lastName:           string;
  email:              string;
  phone?:             string;
  role?:              AgentRole;
  hireDate?:          string;
  maxConcurrentCases?: number;
}

export interface UpdateAgentBody {
  firstName?:          string;
  lastName?:           string;
  email?:              string;
  phone?:              string | null;
  role?:               AgentRole;
  isActive?:           boolean;
  maxConcurrentCases?: number;
}

export const agentsApi = {
  /** Lists active agents. */
  list:        (departmentId?: string)    =>
                 api.get<Agent[]>(`/api/v1/agents${departmentId ? `?departmentId=${departmentId}` : ''}`),
  get:         (id: string)               => api.get<Agent>(`/api/v1/agents/${id}`),
  available:   (skillName: string, limit = 5) =>
                 api.get<Agent[]>(`/api/v1/agents/available?skillName=${encodeURIComponent(skillName)}&limit=${limit}`),
  skills:      (id: string)               => api.get<AgentSkill[]>(`/api/v1/agents/${id}/skills`),
  schedules:   (id: string)               => api.get<AgentSchedule[]>(`/api/v1/agents/${id}/schedules`),

  create:      (body: CreateAgentBody)    => api.post<Agent>('/api/v1/agents', body),
  update:      (id: string, body: UpdateAgentBody) => api.patch<Agent>(`/api/v1/agents/${id}`, body),
  deactivate:  (id: string)               => api.del<void>(`/api/v1/agents/${id}`),
};

export const skillsApi = {
  list: () => api.get<Skill[]>('/api/v1/skills'),
};

export const departmentsApi = {
  list: () => api.get<Department[]>('/api/v1/departments'),
};

export const shiftsApi = {
  list: () => api.get<Shift[]>('/api/v1/shifts'),
};

export const exceptionsApi = {
  /** Agent's own upcoming exceptions (approved + pending). */
  listForAgent: (agentId: string) =>
    api.get<ScheduleException[]>(`/api/v1/agents/${agentId}/exceptions`),

  /** Agent submits a single-day time-off request. */
  create: (agentId: string, body: {
    exceptionDate: string;
    exceptionType: ScheduleExceptionType;
    reason?: string;
  }) => api.post<ScheduleException>(`/api/v1/agents/${agentId}/exceptions`, body),

  /** Multi-day time-off request, one row per day in the range. */
  createRange: (agentId: string, body: {
    fromDate: string;
    toDate: string;
    exceptionType: ScheduleExceptionType;
    reason?: string;
  }) => api.post<ScheduleException[]>(`/api/v1/agents/${agentId}/exceptions/range`, body),

  /** Lead/admin approval queue across all agents. */
  listPending: () => api.get<ScheduleException[]>('/api/v1/exceptions/pending'),

  /** Approved exceptions in a date range. */
  listApproved: (from: string, to: string) =>
    api.get<ScheduleException[]>(`/api/v1/exceptions/approved?from=${from}&to=${to}`),

  /** Lead/admin approves a request. */
  approve: (exceptionId: string, approverAgentId: string) =>
    api.patch<ScheduleException>(
      `/api/v1/exceptions/${exceptionId}/approve`,
      { approverAgentId },
    ),

  /** Lead/admin rejects the request. */
  reject: (exceptionId: string) =>
    api.del<void>(`/api/v1/exceptions/${exceptionId}`),
};
