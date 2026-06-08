import { api } from './client';
import type { WorkflowFailure } from '@/types/api';

export const workflowFailuresApi = {
  recent:  (days = 7)         => api.get<WorkflowFailure[]>(`/api/v1/workflow-failures?days=${days}`),
  forCase: (caseId: string)   => api.get<WorkflowFailure[]>(`/api/v1/cases/${caseId}/workflow-failures`),
};
