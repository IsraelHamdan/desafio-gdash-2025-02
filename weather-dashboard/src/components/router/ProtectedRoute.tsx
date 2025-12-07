import { useAuth } from '@/contexts/authContext';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { status } = useAuth();
  const location = useLocation();

  if (status !== 'authenticated') {
    return <Navigate
      to="/"
      state={{ from: location }}
      replace
    />;
  }

  return <>{children}</>;
}
