import { fail } from './errors'
import { places, fareOptions } from './places'
import { cancelReasons, CANCEL_WINDOW_MINUTES, MAX_STRIKES } from '~/utils/cancelPolicy'
import { driverProfile } from './drivers'
import { declineReasons } from '~/utils/driverPolicy'

const KEY = 'csu_mock_bookings'
const STANDING_KEY = 'csu_mock_standing'

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
}

const load = () => read<any[]>(KEY, [])
const save = (list: any[]) => write(KEY, list)

export function getStanding() {
  return read(STANDING_KEY, { strikeCount: 0, status: 'active', suspendedUntil: null as string | null })
}

export function listBookings() {
  return load().map(b => ({ ...b, serverNow: new Date().toISOString() }))
}

export function createBooking(body: any) {
  const fields: Record<string, string> = {}
  const pickup = places.find(p => p.id === body?.pickupId)
  const dest = places.find(p => p.id === body?.destinationId)
  if (!pickup) fields.pickupId = 'Choose a pickup point'
  if (!dest) fields.destinationId = 'Choose a destination'
  if (pickup && dest && pickup.id === dest.id) fields.destinationId = 'Destination must be different from pickup'

  const when = new Date(body?.pickupAt)
  if (isNaN(when.getTime()) || when.getTime() <= Date.now()) fields.pickupAt = 'Pickup time must be in the future'

  const n = Number(body?.passengers)
  if (!Number.isInteger(n) || n < 1 || n > 6) fields.passengers = 'Passengers must be 1 to 6'

  if (Object.keys(fields).length) throw fail(422, 'VALIDATION', 'Check the highlighted fields.', fields)

  const fare = fareOptions(pickup!, dest!).find(f => f.transport === body?.transport)
  if (!fare) throw fail(422, 'VALIDATION', 'Choose a transport type.', { transport: 'Choose a transport type' })

  const booking = {
    id: `b-${Date.now()}`,
    status: 'Pending',
    pickup: pickup!.name,
    destination: dest!.name,
    passengers: n,
    pickupAt: when.toISOString(),
    acceptedAt: null,
    cancelableUntil: null,
    serverNow: new Date().toISOString(),
    transport: fare.transport,
    fareMin: fare.fareMin,
    fareMax: fare.fareMax
  }
  save([booking, ...load()])
  return booking
}

export function getBooking(id: string) {
  const stored = load().find(b => b.id === id)
  if (stored) return { ...stored, serverNow: new Date().toISOString() }

  // demo bookings from Step 1 (b-1, b-late)
  const minutesAgo = id === 'b-late' ? 45 : 10
  const now = Date.now()
  const acceptedAt = now - minutesAgo * 60_000
  return {
    id,
    status: 'Accepted',
    pickup: 'CSU Main Gate',
    destination: 'CCIS Building',
    passengers: 2,
    pickupAt: new Date(now + 3_600_000).toISOString(),
    acceptedAt: new Date(acceptedAt).toISOString(),
    cancelableUntil: new Date(acceptedAt + CANCEL_WINDOW_MINUTES * 60_000).toISOString(),
    serverNow: new Date(now).toISOString(),
    driver: { id: 'd-1', name: 'Juan D.', plateNumber: 'ABC 1234', vehicleType: 'Tricycle' }
  }
}

export function cancelBooking(id: string, body: any) {
  const list = load()
  const b = list.find(x => x.id === id)
  if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')

  if (b.status !== 'Pending' && b.status !== 'Accepted') {
    throw fail(409, 'NOT_CANCELLABLE', 'This booking can no longer be cancelled.')
  }
  const wasAccepted = b.status === 'Accepted'
  if (wasAccepted && Date.now() > new Date(b.acceptedAt).getTime() + CANCEL_WINDOW_MINUTES * 60_000) {
    throw fail(409, 'CANCEL_WINDOW_CLOSED', `Cancellation closed ${CANCEL_WINDOW_MINUTES} minutes after the driver accepted.`)
  }

  const reason = cancelReasons.find(r => r.code === body?.reasonCode)
  if (!reason) throw fail(422, 'VALIDATION', 'Choose a reason.', { reasonCode: 'Choose a reason' })
  if (reason.needsNote && String(body?.note ?? '').trim().length < 10) {
    throw fail(422, 'VALIDATION', 'Please explain in at least 10 characters.', { note: 'At least 10 characters' })
  }

  b.status = 'Cancelled'
  b.cancelReason = reason.code
  save(list)

  const standing = getStanding()
  if (wasAccepted && reason.mayCount) {
    standing.strikeCount += 1
    if (standing.strikeCount >= MAX_STRIKES) {
      standing.status = 'suspended'
      standing.suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
  write(STANDING_KEY, standing)

  return { booking: { ...b, serverNow: new Date().toISOString() }, standing }
}

// ----- Testing helpers: only exist in the mock, never in the real API -----
export function devAccept(id: string, body: any) {
  const list = load()
  const b = list.find(x => x.id === id)
  if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')
  const acceptedAt = Date.now() - Number(body?.minutesAgo ?? 0) * 60_000
  b.status = 'Accepted'
  b.acceptedAt = new Date(acceptedAt).toISOString()
  b.cancelableUntil = new Date(acceptedAt + CANCEL_WINDOW_MINUTES * 60_000).toISOString()
  b.driver = { id: 'd-1', name: 'Juan D.', plateNumber: 'ABC 1234', vehicleType: b.transport ?? 'Tricycle' }
  save(list)
  return { ...b, serverNow: new Date().toISOString() }
}

export function devResetStanding() {
  write(STANDING_KEY, { strikeCount: 0, status: 'active', suspendedUntil: null })
  return getStanding()
}
// ----- Driver actions -----
export function driverBookings(userId: string | null) {
  driverProfile(userId) // throws if this is not a driver
  return load()
    .filter(b => b.status === 'Pending' || b.driver?.id === userId || b.declinedBy === userId)
    .map(b => ({ ...b, serverNow: new Date().toISOString() }))
}

export function driverAccept(id: string, userId: string | null) {
  const profile = driverProfile(userId)
  if (!profile.plateVerified) throw fail(403, 'DRIVER_NOT_VERIFIED', 'Your plate number is not verified yet.')

  const list = load()
  const b = list.find(x => x.id === id)
  if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')
  if (b.status !== 'Pending') throw fail(409, 'NOT_PENDING', 'This request is no longer available.')

  const acceptedAt = Date.now()
  b.status = 'Accepted'
  b.acceptedAt = new Date(acceptedAt).toISOString()
  b.cancelableUntil = new Date(acceptedAt + CANCEL_WINDOW_MINUTES * 60_000).toISOString()
  b.driver = { id: userId, name: profile.name, plateNumber: profile.plateNumber, vehicleType: profile.vehicleType }
  save(list)
  return { ...b, serverNow: new Date().toISOString() }
}

export function driverDecline(id: string, userId: string | null, body: any) {
  driverProfile(userId)
  const list = load()
  const b = list.find(x => x.id === id)
  if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')
  if (b.status !== 'Pending') throw fail(409, 'NOT_PENDING', 'This request is no longer available.')

  const reason = declineReasons.find(r => r.code === body?.reasonCode)
  if (!reason) throw fail(422, 'VALIDATION', 'Choose a reason.', { reasonCode: 'Choose a reason' })
  if (reason.needsNote && String(body?.note ?? '').trim().length < 10) {
    throw fail(422, 'VALIDATION', 'Please explain in at least 10 characters.', { note: 'At least 10 characters' })
  }

  // The driver's note is not stored here: the real backend keeps it for admins only.
  b.status = 'Declined'
  b.declinedBy = userId
  b.declineReason = reason.code
  b.declineMessage = reason.passengerText
  save(list)
  return { ...b, serverNow: new Date().toISOString() }
}

export function driverComplete(id: string, userId: string | null) {
  driverProfile(userId)
  const list = load()
  const b = list.find(x => x.id === id)
  if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')
  if (b.status !== 'Accepted' || b.driver?.id !== userId) {
    throw fail(409, 'NOT_ACCEPTED', 'This ride cannot be marked as completed.')
  }
  b.status = 'Completed'
  save(list)
  return { ...b, serverNow: new Date().toISOString() }
}