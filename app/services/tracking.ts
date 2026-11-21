import type { TrackingInfo } from '~/types/api'

export function useTrackingService() {
  const api = useApi()
  return {
    send: (p: { lat: number; lng: number }) => api<{ ok: boolean }>('/driver/location', { method: 'POST', body: p }),
    stop: () => api<{ ok: boolean }>('/driver/location', { method: 'DELETE' }),
    forBooking: (bookingId: string) => api<TrackingInfo>(`/bookings/${bookingId}/location`),
    // mock-only testing helper
    devMove: (bookingId: string) => api<{ ok: boolean }>(`/dev/bookings/${bookingId}/move-driver`, { method: 'POST' })
  }
}