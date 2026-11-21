import type {
  AdminCancellation, AdminReport, AdminSummary, AdminUser, Booking, Review
} from '~/types/api'

export function useAdminService() {
  const api = useApi()
  return {
    summary: () => api<AdminSummary>('/admin/summary'),
    users: (query: Record<string, string>) => api<AdminUser[]>('/admin/users', { query }),
    setStatus: (id: string, body: { status: 'active' | 'deactivated'; reasonCode: string; note?: string }) =>
      api<AdminUser>(`/admin/users/${id}/status`, { method: 'PATCH', body }),
    verifyPlate: (id: string, verified: boolean) =>
      api<AdminUser>(`/admin/drivers/${id}/plate`, { method: 'PATCH', body: { verified } }),
    bookings: (query: Record<string, string>) => api<Booking[]>('/admin/bookings', { query }),

    reports: (query: Record<string, string>) => api<AdminReport[]>('/admin/reports', { query }),
    updateReport: (id: string, body: { status: string; reasonCode?: string; note?: string }) =>
      api<{ id: string; status: string }>(`/admin/reports/${id}`, { method: 'PATCH', body }),
    hideReview: (id: string, hidden: boolean) =>
      api<Review>(`/admin/reviews/${id}/hidden`, { method: 'PATCH', body: { hidden } }),

    cancellations: () => api<AdminCancellation[]>('/admin/cancellations'),
    excuse: (id: string, body: { reasonCode: string; note?: string }) =>
      api(`/admin/cancellations/${id}/excuse`, { method: 'POST', body })
  }
}