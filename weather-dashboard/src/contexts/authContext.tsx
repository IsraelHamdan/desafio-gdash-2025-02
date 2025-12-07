import Tipography from '@/components/Tipography';
import { useAuthStore, type AuthState } from '@/hooks/useAuthStore';
import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';


type AuthContextValue = AuthState;

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthStore();
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, []);

  if (auth.status === 'checking') {
    return <Tipography variant='h2'>Carregando seção</Tipography>;
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
