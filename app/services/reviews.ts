import type { CreateReviewPayload, DriverReviews, Review } from '~/types/api'

export function useReviewService() {
  const api = useApi()
  return {
    forBooking: (bookingId: string) => api<Review | null>(`/bookings/${bookingId}/review`),
    create: (bookingId: string, body: CreateReviewPayload) =>
      api<Review>(`/bookings/${bookingId}/review`, { method: 'POST', body }),
    forDriver: (driverId: string) => api<DriverReviews>(`/drivers/${driverId}/reviews`)
  }
}