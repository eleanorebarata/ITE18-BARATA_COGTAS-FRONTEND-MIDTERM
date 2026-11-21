import { fail } from './errors'
import { read, write } from './storage'
import { places } from './places'
import { driverBookings, findBooking } from './bookings'

const KEY = 'csu_mock_locations'
type Saved = Record<string, { lat: number; lng: number; updatedAt: string }>
const load = () => read<Saved>(KEY, {})

export function setDriverLocation(userId: string, body: any) {
  const lat = body?.lat
  const lng = body?.lng
  if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw fail(422, 'VALIDATION', 'Invalid location.')
  }
  const hasRide = driverBookings(userId).some(b => b.status === 'Accepted' && b.driver?.id === userId)
  if (!hasRide) {
    throw fail(409, 'NO_ACTIVE_RIDE', 'Location sharing is only available during an accepted ride.')
  }
  const all = load()
  all[userId] = { lat, lng, updatedAt: new Date().toISOString() }
  write(KEY, all)
  return { ok: true }
}

export function stopDriverLocation(userId: string) {
  const all = load()
  delete all[userId]
  write(KEY, all)
  return { ok: true }
}

export function getBookingTracking(userId: string, bookingId: string) {
  const b = findBooking(bookingId)
  if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')
  if (b.passengerId && b.passengerId !== userId) throw fail(403, 'FORBIDDEN', 'This is not your booking.')

  const serverNow = new Date().toISOString()
  if (b.status !== 'Accepted' || !b.driver) return { active: false, pickup: null, driver: null, serverNow }

  const place = places.find(p => p.name === b.pickup)
  const loc = load()[b.driver.id]
  return {
    active: true,
    pickup: place ? { name: place.name, lat: place.lat, lng: place.lng } : null,
    driver: loc ? { lat: loc.lat, lng: loc.lng, updatedAt: loc.updatedAt } : null,
    serverNow
  }
}

// Testing helper, mock only: moves the driver 25% closer to the pickup point.
export function devMoveDriver(bookingId: string) {
  const b = findBooking(bookingId)
  if (!b || b.status !== 'Accepted' || !b.driver) {
    throw fail(409, 'NO_ACTIVE_RIDE', 'The booking must be accepted first.')
  }
  const pickup = places.find(p => p.name === b.pickup)
  if (!pickup) throw fail(404, 'NOT_FOUND', 'Pickup point not found.')

  const all = load()
  const cur = all[b.driver.id] ?? { lat: pickup.lat + 0.006, lng: pickup.lng + 0.006 }
  all[b.driver.id] = {
    lat: cur.lat + (pickup.lat - cur.lat) * 0.25,
    lng: cur.lng + (pickup.lng - cur.lng) * 0.25,
    updatedAt: new Date().toISOString()
  }
  write(KEY, all)
  return { ok: true }
}