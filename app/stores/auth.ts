import { defineStore } from 'pinia'
import type { AccountStatus, LoginResult, Role } from '~/types/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as { id: string; name: string; email: string } | null,
    role: null as Role | null,
    status: 'active' as AccountStatus,
    suspendedUntil: null as string | null
  }),
  getters: {
    isLoggedIn: (s) => !!s.token
  },
  actions: {
    setSession(p: LoginResult) {
      this.token = p.token
      this.user = p.user
      this.role = p.role
      this.status = p.status
      this.suspendedUntil = p.suspendedUntil
    },
    logout() {
      this.$reset()
    }
  }
})