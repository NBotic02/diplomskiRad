import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider, App as AntApp } from 'antd';
import { Auth0Provider, type AppState } from '@auth0/auth0-react';

import App from './App';
import { themeConfig } from './theme';
import { AuthBridge } from './components/AuthBridge';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const auth0Domain   = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;

/** Clears the Auth0 callback query params from the URL after redirect. */
function onRedirectCallback(appState?: AppState) {
  const target = appState?.returnTo ?? window.location.pathname;
  window.history.replaceState({}, document.title, target);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(auth0Audience ? { audience: auth0Audience } : {}),
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
    >
      <ConfigProvider theme={themeConfig}>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthBridge />
              <App />
            </BrowserRouter>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </Auth0Provider>
  </StrictMode>,
);
