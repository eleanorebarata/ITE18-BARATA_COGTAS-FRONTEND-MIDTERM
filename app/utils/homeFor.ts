import type { Role } from '~/types/api'

export function homeFor(role: Role | null) {
  if (role === 'driver') return '/driver/requests'
  if (role === 'admin') return '/admin'
  return '/user/bookings'
}