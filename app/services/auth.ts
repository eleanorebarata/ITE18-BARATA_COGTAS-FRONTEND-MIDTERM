import type { LoginResult, Role } from '~/types/api'

const paths: Record<Role, string> = {
  passenger: 'user-login',
  driver: 'driver-login',
  admin: 'admin-login'
}

export function useAuthService() {
  const api = useApi()
  return {
    login: (role: Role, body: { email: string; password: string }) =>
      api<LoginResult>(`/auth/${paths[role]}`, { method: 'POST', body })
  }
}