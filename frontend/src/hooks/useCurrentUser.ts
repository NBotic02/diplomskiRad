import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';

import { readAgentId, readDepartmentId, readRole, ROLES, type Role } from '@/lib/roles';

export interface CurrentUser {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | undefined;
  name: string | undefined;
  picture: string | undefined;
  role: Role;
  agentId: string | undefined;
  departmentId: string | undefined;
  isAdmin: boolean;
  isLead: boolean;
  isAgent: boolean;
  /** True for admin or lead. */
  canSeeTeam: boolean;
}

export function useCurrentUser(): CurrentUser {
  const { user, isAuthenticated, isLoading } = useAuth0();

  return useMemo<CurrentUser>(() => {
    const role = readRole(user);
    return {
      isAuthenticated,
      isLoading,
      email:        user?.email,
      name:         user?.name,
      picture:      user?.picture,
      role,
      agentId:      readAgentId(user),
      departmentId: readDepartmentId(user),
      isAdmin:           role === ROLES.ADMIN,
      isLead:  role === ROLES.LEAD,
      isAgent:           role === ROLES.AGENT,
      canSeeTeam:        role === ROLES.ADMIN || role === ROLES.LEAD,
    };
  }, [user, isAuthenticated, isLoading]);
}
