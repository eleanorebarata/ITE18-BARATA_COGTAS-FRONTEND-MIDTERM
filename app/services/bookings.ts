import type { Booking, CancelPayload, CancelResult, CreateBookingPayload, FareOption, Place, Standing } from '~/types/api'

export function useBookingService() {
  const api = useApi()
  return {
    places: () => api<Place[]>('/places'),
    fares: (from: string, to: string) => api<FareOption[]>('/fares', { query: { from, to } }),
    list: () => api<Booking[]>('/bookings'),
    create: (body: CreateBookingPayload) => api<Booking>('/bookings', { method: 'POST', body }),
    get: (id: string) => api<Booking>(`/bookings/${id}`),
    cancel: (id: string, body: CancelPayload) =>
      api<CancelResult>(`/bookings/${id}/cancel`, { method: 'POST', body }),
    standing: () => api<Standing>('/me/standing'),
    // mock-only testing helpers
    devAccept: (id: string, minutesAgo: number) =>
      api<Booking>(`/dev/bookings/${id}/accept`, { method: 'POST', body: { minutesAgo } }),
    devResetStanding: () => api<Standing>('/dev/reset-standing', { method: 'POST' })
  }
}