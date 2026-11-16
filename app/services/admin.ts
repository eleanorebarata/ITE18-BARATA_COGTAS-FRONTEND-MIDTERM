import type { AdminSummary, AdminUser, Booking } from '~/types/api'

export function useAdminService() {
  const api = useApi()
  return {
    summary: () => api<AdminSummary>('/admin/summary'),
    users: (query: Record<string, string>) => api<AdminUser[]>('/admin/users', { query }),
    setStatus: (id: string, body: { status: 'active' | 'deactivated'; reasonCode: string; note?: string }) =>
      api<AdminUser>(`/admin/users/${id}/status`, { method: 'PATCH', body }),
    verifyPlate: (id: string, verified: boolean) =>
      api<AdminUser>(`/admin/drivers/${id}/plate`, { method: 'PATCH', body: { verified } }),
    bookings: (query: Record<string, string>) => api<Booking[]>('/admin/bookings', { query })
  }
}