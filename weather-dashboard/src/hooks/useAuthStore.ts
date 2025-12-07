import { api } from '@/lib/api';
import type { CreateUserDto, LoginUserDto, UserResponse } from '@/lib/validations/auth.dto';
import { AxiosError } from 'axios';
import {create} from 'zustand'
import {devtools} from 'zustand/middleware'

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  user: UserResponse | null
  // ações
  bootstrap: () => Promise<void>
  login: (input: LoginUserDto) => Promise<UserResponse>
  register: (input: CreateUserDto) => Promise<UserResponse>
  logout: () => Promise<void>
  setUser: (user: UserResponse) => void
}


export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    status: 'checking',
    user: null,

    async bootstrap() {
      set({ status: 'checking' })

      try {
        const res = await api.get<UserResponse>('/auth/me')
        const user = res.data

        set({
          user,
          status: 'authenticated',
        })
      } catch (err) {
        set({
          user: null,
          status: 'unauthenticated',
        })
      }
    },

    async login(input: LoginUserDto) {
      try {
        const res = await api.post<UserResponse>('/auth/login', input)
        const user = res.data
        set({
          user,
          status: 'authenticated',
        })
      } catch (err) {
        if (err instanceof AxiosError) {
          console.error('Erro no login:', err.response?.data ?? err.message)
        } else {
          console.error(err)
        }

        // garante estado coerente num erro de login
        set({
          user: null,
          status: 'unauthenticated',
        })

        throw err
      }
    },

    async register(input: CreateUserDto) {
      try {
        const res = await api.post<UserResponse>('/auth/register', input)
        const user = res.data

        set({
          user,
          status: 'authenticated',
        })
      } catch (err) {
        if (err instanceof AxiosError) {
          console.error('Erro no cadastro:', err.response?.data ?? err.message)
        } else {
          console.error(err)
        }

        set({
          user: null,
          status: 'unauthenticated',
        })

        throw err
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (err) {
        if (err instanceof AxiosError) {
          console.error('Erro no logout:', err.response?.data ?? err.message)
        } else {
          console.error(err)
        }
      } finally {
        set({
          user: null,
          status: 'unauthenticated',
        })
      }
    },
  })),
)
