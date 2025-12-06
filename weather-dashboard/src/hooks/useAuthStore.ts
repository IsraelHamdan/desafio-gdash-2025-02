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
}


export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    status: 'checking', 
    user: null,

    async bootstrap() {
      set({ status: 'checking' })

      try {
        const { data } = await api.get('/auth/me')

        const user = data as UserResponse

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
      console.info('Cheguei')
      try { 
        const {data} = await api.post<UserResponse>('auth/login', input)
        
        const user = data ?? data
        console.log(data)

        set({user, status: 'authenticated'})

      } catch(err) {
        if(err instanceof AxiosError) {
          throw new AxiosError(err.message)
        }
        console.log(err)
      }
    },

    async register(input: CreateUserDto) {
      try { 
            const {data} = await api.post<UserResponse>('auth/register', input)

      const user = data ?? data

      set({
        user,
        status: 'authenticated'
      })
      } catch(err) {
        if(err instanceof AxiosError) { 
          throw new AxiosError(err.message)
        }
        console.log(err)
      }
    },

    async logout() {
      try { 
        await api.post('auth/logout')
      } catch(err) {
        if(err instanceof AxiosError) { 
          throw new AxiosError(err.message)
        }
      } finally {
        set({
          user: null, 
          status: 'unauthenticated'
        })
      }
    }

  }))


)