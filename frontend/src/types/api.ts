export type CasePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseStatus =
  | 'NEW' | 'OPEN' | 'PENDING' | 'ON_HOLD' | 'PENDING_APPROVAL'
  | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type SenderType    = 'CUSTOMER' | 'AGENT' | 'SYSTEM';
export type CustomerTier  = 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
export type SlaStatus     = 'WITHIN_SLA' | 'AT_RISK' | 'BREACHED';
export type AgentRole     = 'AGENT' | 'LEAD' | 'ADMIN';
export type Proficiency   = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'SLACK';
export type NotificationStatus  = 'PENDING' | 'SENT' | 'FAILED';
export type BottleneckType  = 'HIGH_VOLUME' | 'SLA_BREACH_RATE' | 'SLOW_RESOLUTION' | 'AGENT_OVERLOAD';
export type Severity        = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Customer {
  customerId: string;
  externalId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  tier: CustomerTier;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Case {
  caseId: string;
  caseNumber: number | null;
  customerId: string;
  categoryId: number | null;
  subject: string;
  description: string | null;
  priority: CasePriority;
  status: CaseStatus;
  assignedAgentId: string | null;
  teamId: string | null;
  reopenedCount: number;
  satisfactionScore: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CaseCategory {
  categoryId: number;
  name: string;
  parentCategoryId: number | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Communication {
  communicationId: string;
  caseId: string;
  senderType: SenderType;
  senderId: string;
  subject: string | null;
  body: string;
  createdAt: string | null;
}

export interface Note {
  noteId: string;
  caseId: string;
  authorId: string;
  content: string;
  isPinned: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SlaTracking {
  trackingId: number;
  caseId: string;
  slaPolicyId: number;
  slaStatus: SlaStatus;
  responseDeadline: string;
  resolutionDeadline: string;
  firstResponseAt: string | null;
  responseMet: boolean | null;
  resolutionMet: boolean | null;
  breachedAt: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Agent {
  agentId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: AgentRole;
  hireDate: string | null;
  isActive: boolean;
  maxConcurrentCases: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Skill {
  skillId: string;
  name: string;
  category: string | null;
  description: string | null;
  isActive: boolean;
}

export interface AgentSkill {
  agentId: string;
  skillId: string;
  skillName: string;
  proficiency: Proficiency;
  certifiedAt: string | null;
}

export interface Department {
  departmentId: string;
  name: string;
  departmentLeadId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
}

export interface Shift {
  shiftId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timezone: string;
  isOvernight: boolean;
  isActive: boolean;
}

export interface AgentSchedule {
  scheduleId: string;
  agentId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdAt: string | null;
}

export type ScheduleExceptionType =
  | 'HOLIDAY' | 'SICK_LEAVE' | 'VACATION' | 'TRAINING' | 'OTHER';

export interface ScheduleException {
  exceptionId: string;
  agentId: string;
  exceptionDate: string;
  exceptionType: ScheduleExceptionType;
  reason: string | null;
  isApproved: boolean;
  approvedBy: string | null;
  createdAt: string | null;
}

export interface Notification {
  notificationId: string;
  ruleId: string | null;
  caseId: string;
  recipientId: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  channel: NotificationChannel;
  subject: string | null;
  body: string | null;
  status: NotificationStatus;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AgentPerformance {
  agentId: string;
  periodStart: string;
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  casesAssigned: number;
  casesResolved: number;
  casesEscalated: number;
  avgResolutionMinutes: number | null;
  avgFirstResponseMinutes: number | null;
  slaComplianceRate: number | null;
  customerSatisfactionAvg: number | null;
}

export interface DailyMetric {
  metricDate: string;
  totalCreated: number;
  totalResolved: number;
  totalEscalated: number;
  totalReopened: number;
  autoResolved: number;
  avgFirstResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  slaComplianceRate: number | null;
  customerSatisfactionAvg: number | null;
  casesByPriority: Record<string, number>;
  casesByCategory: Record<string, number>;
}

export interface Bottleneck {
  id: string;
  detectedAt: string;
  bottleneckType: BottleneckType;
  description: string;
  affectedEntityType: string | null;
  affectedEntityId: string | null;
  metricValue: number;
  thresholdValue: number;
  severity: Severity;
  isResolved: boolean;
  resolvedAt: string | null;
}

export interface WorkflowFailure {
  failureId:        string;
  workflowName:     string;
  n8nExecutionId:   string | null;
  caseId:           string | null;
  failedNode:       string;
  errorMessage:     string | null;
  errorPayload:     Record<string, unknown> | null;
  inboundPayload:   Record<string, unknown> | null;
  caseStatusBefore: string | null;
  compensated:      boolean;
  createdAt:        string;
}
