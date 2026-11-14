import type { Booking, DriverProfile, DriverRegisterPayload } from '~/types/api'

export function useDriverService() {
  const api = useApi()
  return {
    register: (body: DriverRegisterPayload) =>
      api<{ message: string }>('/auth/driver-register', { method: 'POST', body }),
    profile: () => api<DriverProfile>('/driver/profile'),
    bookings: () => api<Booking[]>('/driver/bookings'),
    accept: (id: string) => api<Booking>(`/driver/bookings/${id}/accept`, { method: 'POST' }),
    decline: (id: string, body: { reasonCode: string; note?: string }) =>
      api<Booking>(`/driver/bookings/${id}/decline`, { method: 'POST', body }),
    complete: (id: string) => api<Booking>(`/driver/bookings/${id}/complete`, { method: 'POST' }),
    // mock-only testing helper
    devVerify: () => api<DriverProfile>('/dev/driver/verify', { method: 'POST' })
  }
}