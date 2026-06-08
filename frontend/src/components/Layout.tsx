import { Layout as AntLayout, Menu } from 'antd';
import {
  DashboardOutlined,
  InboxOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';

import { UserMenu } from '@/components/UserMenu';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLES, type Role } from '@/lib/roles';

const { Sider, Header, Content } = AntLayout;

interface MenuLink {
  key:   string;
  icon:  React.ReactNode;
  label: string;
  /** Roles allowed to see this link. Omit for "everyone". */
  allow?: Role[];
}

interface MenuGroup {
  label:    string;
  children: MenuLink[];
}

const menu: MenuGroup[] = [
  {
    label: 'Work',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/cases',     icon: <InboxOutlined />,     label: 'Cases'     },
    ],
  },
  {
    label: 'Team',
    children: [
      { key: '/employees', icon: <TeamOutlined />,     label: 'Employees',
        allow: [ROLES.ADMIN, ROLES.LEAD] },
      { key: '/calendar',  icon: <CalendarOutlined />, label: 'Calendar'  },
    ],
  },
  {
    label: 'Insight',
    children: [
      { key: '/statistics', icon: <BarChartOutlined />, label: 'Statistics' },
    ],
  },
  {
    label: 'Admin',
    children: [
      { key: '/workflow-failures', icon: <WarningOutlined />, label: 'Workflow failures',
        allow: [ROLES.ADMIN] },
    ],
  },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const me = useCurrentUser();

  const visible: MenuProps['items'] = menu
    .map(group => ({
      type: 'group' as const,
      label: group.label,
      children: group.children
        .filter(link => !link.allow || link.allow.includes(me.role))
        .map(({ key, icon, label }) => ({ key, icon, label })),
    }))
    .filter(group => Array.isArray(group.children) && group.children.length > 0);

  const flatKeys = menu.flatMap(g => g.children.map(c => c.key));
  const selectedKey = flatKeys
    .filter(k => location.pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0] ?? '/dashboard';

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={224} theme="dark" style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <div className="brand-strip">
          <img src="/logo.png" alt="" style={{ height: 22, width: 'auto' }} />
          Supportly
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={visible}
          onSelect={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 0, paddingTop: 8 }}
        />
      </Sider>

      <AntLayout>
        <Header style={{
          borderBottom: '1px solid #e4e4e7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
          <UserMenu />
        </Header>

        <Content>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
