import { Navigate } from 'react-router-dom';
import { Result } from 'antd';
import type { ReactNode } from 'react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Role } from '@/lib/roles';

interface RequireRoleProps {
  /** Roles allowed to render the children. Order doesn't matter. */
  allow: Role[];
  /** What to render when the user doesn't pass. Default: in-page 403. */
  fallback?: ReactNode;
  children: ReactNode;
}

/** Route-level RBAC guard for a list of allowed roles. */
export function RequireRole({ allow, fallback, children }: RequireRoleProps) {
  const me = useCurrentUser();

  if (me.isLoading) return null;
  if (!me.isAuthenticated) return <Navigate to="/" replace />;

  if (!allow.includes(me.role)) {
    return (
      fallback ?? (
        <Result
          status="403"
          title="Restricted"
          subTitle="This view is reserved for higher-privileged accounts. Ask an administrator if you need access."
        />
      )
    );
  }

  return <>{children}</>;
}
