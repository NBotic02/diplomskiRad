import { Avatar, Button, Dropdown, Space, Spin, Tag, Typography } from 'antd';
import {
  CrownOutlined,
  LoginOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLES, type Role } from '@/lib/roles';

const { Text } = Typography;

const ROLE_PRESENTATION: Record<Role, { label: string; color: string; icon: React.ReactNode }> = {
  [ROLES.ADMIN]:           { label: 'Admin',  color: 'magenta', icon: <CrownOutlined /> },
  [ROLES.LEAD]: { label: 'Lead',   color: 'gold',    icon: <SafetyCertificateOutlined /> },
  [ROLES.AGENT]:           { label: 'Agent',  color: 'blue',    icon: <UserOutlined /> },
};

/** Header user widget with avatar, role badge and sign-out dropdown. */
export function UserMenu() {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const me = useCurrentUser();

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        size="small"
        type="primary"
        icon={<LoginOutlined />}
        onClick={() => loginWithRedirect()}
      >
        Login
      </Button>
    );
  }

  const initials = (user.name ?? user.email ?? '?')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const role = ROLE_PRESENTATION[me.role];

  return (
    <Dropdown
      placement="bottomRight"
      trigger={['click']}
      menu={{
        items: [
          {
            key: 'identity',
            label: (
              <Space direction="vertical" size={2} style={{ minWidth: 220 }}>
                <Text strong>{user.name ?? user.email}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{user.email}</Text>
                <Tag bordered={false} color={role.color} icon={role.icon} style={{ marginTop: 4 }}>
                  {role.label}
                </Tag>
              </Space>
            ),
            disabled: true,
          },
          { type: 'divider' },
          {
            key: 'logout',
            label: 'Sign out',
            icon: <LogoutOutlined />,
            onClick: () => logout({ logoutParams: { returnTo: window.location.origin } }),
          },
        ],
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          padding: '4px 12px 4px 8px',
          borderRadius: 8,
        }}
      >
        <Avatar
          size={36}
          src={user.picture}
          icon={!user.picture ? <UserOutlined /> : undefined}
          style={{ background: '#18181b', color: '#fafafa', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
        >
          {!user.picture && initials}
        </Avatar>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2, minWidth: 0 }}>
          <Text strong style={{ fontSize: 13, color: '#18181b', lineHeight: 1.2 }}>
            {user.name ?? user.email}
          </Text>
          <Tag
            bordered={false}
            color={role.color}
            style={{ margin: '4px 0 0', fontSize: 10, lineHeight: '16px', padding: '0 6px' }}
          >
            {role.label}
          </Tag>
        </div>
      </div>
    </Dropdown>
  );
}
