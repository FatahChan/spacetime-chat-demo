import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { useMemo } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';
import type { Identity } from 'spacetimedb';
import {
  SpacetimeDBQueryClient,
  SpacetimeDBProvider,
} from 'spacetimedb/tanstack';
import { routeTree } from './routeTree.gen';
import { DbConnection, ErrorContext } from './module_bindings';
import { oidcConfig, onSigninCallback } from './auth';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000';
const DB_NAME =
  import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'my-spacetime-app-6ali9';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;

const spacetimeDBQueryClient = new SpacetimeDBQueryClient();

const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: spacetimeDBQueryClient.queryFn,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});
spacetimeDBQueryClient.connect(queryClient);

function SpacetimeDBWrapper({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const idToken = auth.user?.id_token;

  const connectionBuilder = useMemo(() => {
    if (!idToken) return null;

    const onConnect = (conn: DbConnection, _identity: Identity, token: string) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
      }
      spacetimeDBQueryClient.setConnection(conn);
    };

    const onDisconnect = () => {};

    const onConnectError = (_ctx: ErrorContext, err: Error) => {
      console.error('Error connecting to SpacetimeDB:', err);
    };

    return DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(DB_NAME)
      .withToken(idToken)
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .onConnectError(onConnectError);
  }, [idToken]);

  if (!auth.isAuthenticated || !connectionBuilder) {
    return <>{children}</>;
  }

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      {children}
    </SpacetimeDBProvider>
  );
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: () => (
      <div className="p-8">
        <h1 className="text-2xl font-bold">404</h1>
        <p>Page Not Found</p>
      </div>
    ),
    context: { queryClient },
    Wrap: ({ children }) => (
      <AuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
        <SpacetimeDBWrapper>{children}</SpacetimeDBWrapper>
      </AuthProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
