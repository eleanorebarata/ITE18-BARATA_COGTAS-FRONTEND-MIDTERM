import type {
  AdminCancellation, AdminReport, AdminSummary, AdminUser, Booking, FareRule, Place, Review
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
      api(`/admin/cancellations/${id}/excuse`, { method: 'POST', body }),

    places: () => api<Place[]>('/admin/places'),
    addPlace: (body: { name: string; lat: number; lng: number }) =>
      api<Place>('/admin/places', { method: 'POST', body }),
    updatePlace: (id: string, body: Partial<{ name: string; lat: number; lng: number; active: boolean }>) =>
      api<Place>(`/admin/places/${id}`, { method: 'PATCH', body }),
    fareRules: () => api<FareRule[]>('/fare-rules'),
    saveFareRules: (body: FareRule[]) => api<FareRule[]>('/admin/fare-rules', { method: 'PUT', body })
  }
}