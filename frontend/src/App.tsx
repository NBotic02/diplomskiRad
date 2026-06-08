import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Spin } from 'antd';

import { Layout } from '@/components/Layout';
import { RequireRole } from '@/components/RequireRole';
import { Dashboard } from '@/pages/Dashboard';
import { Cases } from '@/pages/Cases';
import { CaseDetail } from '@/pages/CaseDetail';
import { Employees } from '@/pages/Employees';
import { Calendar } from '@/pages/Calendar';
import { Statistics } from '@/pages/Statistics';
import { WorkflowFailures } from '@/pages/WorkflowFailures';
import { Landing } from '@/pages/Landing';
import { ROLES } from '@/lib/roles';

export default function App() {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return (
      <div style={{
        display: 'grid', placeItems: 'center',
        minHeight: '100vh', background: '#fafafa',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/cases"         element={<Cases />} />
        <Route path="/cases/:caseId" element={<CaseDetail />} />

        <Route path="/employees" element={
          <RequireRole allow={[ROLES.ADMIN, ROLES.LEAD]}>
            <Employees />
          </RequireRole>
        } />
        <Route path="/calendar" element={<Calendar />} />

        <Route path="/statistics" element={<Statistics />} />

        <Route path="/workflow-failures" element={
          <RequireRole allow={[ROLES.ADMIN]}>
            <WorkflowFailures />
          </RequireRole>
        } />
      </Route>
    </Routes>
  );
}
