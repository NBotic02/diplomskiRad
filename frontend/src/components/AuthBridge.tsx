import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setTokenGetter } from '@/lib/auth';

/** Pushes Auth0's token getter into the fetch wrapper. */
export function AuthBridge() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(() => getAccessTokenSilently());
    } else {
      setTokenGetter(null);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return null;
}
