import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export const Route = createFileRoute('/callback')({
  component: CallbackPage,
});

function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg text-gray-600">Completing sign in...</p>
    </div>
  );
}
