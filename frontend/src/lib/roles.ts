// Auth0 Post-Login Action dodaje role, agent_id i department_id pod
// namespace-om https://supportly/. Ako neki claim fali, default je AGENT.
export const NS = 'https://supportly';

export const ROLES = {
  ADMIN: 'ADMIN',
  LEAD: 'LEAD',
  AGENT: 'AGENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/* eslint-disable @typescript-eslint/no-explicit-any */
function read(user: any, key: string): string | undefined {
  if (!user) return undefined;
  const v = user[`${NS}/${key}`];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export function readRole(user: unknown): Role {
  const raw = read(user, 'role');
  if (raw === ROLES.ADMIN || raw === ROLES.LEAD || raw === ROLES.AGENT) {
    return raw;
  }
  return ROLES.AGENT;
}

export function readAgentId(user: unknown): string | undefined {
  return read(user, 'agent_id');
}

export function readDepartmentId(user: unknown): string | undefined {
  return read(user, 'department_id');
}
