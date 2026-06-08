import { useAuth0 } from '@auth0/auth0-react';
import { Button, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title } = Typography;

/** Sign-in wall shown when the user is not authenticated. */
export function Landing() {
  const { loginWithRedirect } = useAuth0();

  const signIn = () => loginWithRedirect();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(2rem, 1fr) minmax(0, 36rem) minmax(2rem, 2fr)',
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #ffffff 0%, #fafafa 70%, #f4f4f5 100%)',
      }}
    >
      <div />
      <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <img
            src="/logo.png"
            alt="Supportly"
            style={{ height: 44, width: 'auto', display: 'block' }}
          />
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: '#18181b',
            }}
          >
            Supportly
          </span>
        </div>

        <Title
          level={1}
          style={{
            fontSize: 48,
            lineHeight: 1.05,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            margin: '0 0 32px',
            color: '#18181b',
          }}
        >
          Customer support, on autopilot.
        </Title>

        <div>
          <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={signIn}>
            Sign in
          </Button>
        </div>
      </main>
      <div />
    </div>
  );
}
