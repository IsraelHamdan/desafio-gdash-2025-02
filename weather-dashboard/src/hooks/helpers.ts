import { useAuthStore } from "./useAuthStore";

export const useAuthStatus = () =>
  useAuthStore((state) => state.status)

export const useAuthUser = () =>
  useAuthStore((state) => state.user)

export const useAuthenticatedUser = () => {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)

  if (status !== 'authenticated' || !user) {
    throw new Error('useAuthenticatedUser usado sem sessão autenticada')
  }

  return user
}