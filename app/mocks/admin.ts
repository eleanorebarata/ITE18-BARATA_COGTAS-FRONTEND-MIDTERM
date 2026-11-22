import { fail } from './errors'
import { allUsers } from './drivers'
import { listBookings } from './bookings'
import { read, write, OVERRIDES_KEY } from './storage'
import type { MockUser } from './users'
import { deactivateReasons, reactivateReasons } from '~/utils/adminPolicy'
import { allPlaces, activePlaces, savePlaces, fareRules, saveFareRules } from './places'
import type { FareRule, Place } from '~/types/api'

export function requireAdmin(userId: string | null) {
  const u = allUsers().find(x => x.id === userId && x.role === 'admin')
  if (!u) throw fail(403, 'FORBIDDEN', 'Administrator account required.')
  return u
}

const strip = (u: MockUser) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
  contact: u.contact, plateNumber: u.plateNumber, vehicleType: u.vehicleType,
  plateVerified: u.plateVerified, statusReason: u.statusReason
})

function setOverride(id: string, patch: Partial<MockUser>) {
  const overrides = read<Record<string, Partial<MockUser>>>(OVERRIDES_KEY, {})
  overrides[id] = { ...overrides[id], ...patch }
  write(OVERRIDES_KEY, overrides)
}

export function adminUsers(userId: string | null, q: Record<string, string>) {
  requireAdmin(userId)
  let list = allUsers()
  if (q.role) list = list.filter(u => u.role === q.role)
  if (q.status) list = list.filter(u => u.status === q.status)
  if (q.q) {
    const s = q.q.toLowerCase()
    list = list.filter(u =>
      u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.plateNumber ?? '').toLowerCase().includes(s)
    )
  }
  return list.map(strip)
}

export function setUserStatus(adminId: string | null, id: string, body: any) {
  const admin = requireAdmin(adminId)
  const target = allUsers().find(u => u.id === id)
  if (!target) throw fail(404, 'NOT_FOUND', 'User not found.')
  if (target.id === admin.id) throw fail(409, 'SELF_DEACTIVATE', 'You cannot deactivate your own account.')

  const status = body?.status
  if (status !== 'active' && status !== 'deactivated') throw fail(422, 'VALIDATION', 'Invalid status.')

  const reasons = status === 'deactivated' ? deactivateReasons : reactivateReasons
  const reason = reasons.find(r => r.code === body?.reasonCode)
  if (!reason) throw fail(422, 'VALIDATION', 'Choose a reason.', { reasonCode: 'Choose a reason' })
  const note = String(body?.note ?? '').trim()
  if (reason.needsNote && note.length < 10) {
    throw fail(422, 'VALIDATION', 'Please explain in at least 10 characters.', { note: 'At least 10 characters' })
  }

  const statusReason = note ? `${reason.label}: ${note}` : reason.label
  setOverride(id, { status, statusReason })
  return strip({ ...target, status, statusReason })
}

export function verifyDriverPlate(adminId: string | null, id: string, body: any) {
  requireAdmin(adminId)
  const target = allUsers().find(u => u.id === id && u.role === 'driver')
  if (!target) throw fail(404, 'NOT_FOUND', 'Driver not found.')
  const plateVerified = !!body?.verified
  setOverride(id, { plateVerified })
  return strip({ ...target, plateVerified })
}

export function adminBookings(userId: string | null, q: Record<string, string>) {
  requireAdmin(userId)
  const list = listBookings()
  return q.status ? list.filter(b => b.status === q.status) : list
}

export function adminSummary(userId: string | null) {
  requireAdmin(userId)
  const bookings = { Pending: 0, Accepted: 0, Declined: 0, Completed: 0, Cancelled: 0 } as Record<string, number>
  for (const b of listBookings()) bookings[b.status] = (bookings[b.status] ?? 0) + 1
  const users = allUsers()
  return {
    bookings,
    activeUsers: users.filter(u => u.status === 'active').length,
    suspendedUsers: users.filter(u => u.status === 'suspended').length,
    deactivatedUsers: users.filter(u => u.status === 'deactivated').length,
    pendingPlates: users.filter(u => u.role === 'driver' && !u.plateVerified).length
  }
}


const inUse = (name: string) =>
  listBookings().some(b => (b.status === 'Pending' || b.status === 'Accepted') && (b.pickup === name || b.destination === name))

function checkPlace(body: any, whole: boolean) {
  const fields: Record<string, string> = {}
  if (whole || body?.name !== undefined) {
    const n = String(body?.name ?? '').trim()
    if (n.length < 3 || n.length > 60) fields.name = 'Name must be 3 to 60 characters'
  }
  if (whole || body?.lat !== undefined) {
    if (typeof body?.lat !== 'number' || body.lat < 4 || body.lat > 22) fields.lat = 'Latitude must be between 4 and 22'
  }
  if (whole || body?.lng !== undefined) {
    if (typeof body?.lng !== 'number' || body.lng < 116 || body.lng > 127) fields.lng = 'Longitude must be between 116 and 127'
  }
  if (Object.keys(fields).length) throw fail(422, 'VALIDATION', 'Check the highlighted fields.', fields)
}

const dup = () => fail(409, 'DUPLICATE', 'A pickup point with this name already exists.', { name: 'This name is already used' })

export function adminPlaces(adminId: string | null) {
  requireAdmin(adminId)
  return allPlaces()
}

export function addPlace(adminId: string | null, body: any) {
  requireAdmin(adminId)
  checkPlace(body, true)
  const name = String(body.name).trim()
  if (allPlaces().some(p => p.name.toLowerCase() === name.toLowerCase())) throw dup()
  const place: Place = { id: `p-${Date.now()}`, name, lat: body.lat, lng: body.lng, active: true }
  savePlaces([...allPlaces(), place])
  return place
}

export function updatePlace(adminId: string | null, id: string, body: any) {
  requireAdmin(adminId)
  const list = allPlaces()
  const current = list.find(p => p.id === id)
  if (!current) throw fail(404, 'NOT_FOUND', 'Pickup point not found.')
  checkPlace(body, false)

  const next: Place = { ...current }
  if (body.name !== undefined) next.name = String(body.name).trim()
  if (body.lat !== undefined) next.lat = body.lat
  if (body.lng !== undefined) next.lng = body.lng
  if (body.active !== undefined) next.active = !!body.active

  const deactivating = current.active !== false && next.active === false
  const changed = next.name !== current.name || next.lat !== current.lat || next.lng !== current.lng || deactivating
  if (changed && inUse(current.name)) {
    throw fail(409, 'IN_USE', 'This pickup point has pending or accepted bookings. Try again when they are finished.')
  }
  if (next.name.toLowerCase() !== current.name.toLowerCase()
    && list.some(p => p.id !== id && p.name.toLowerCase() === next.name.toLowerCase())) throw dup()
  if (deactivating && activePlaces().length <= 2) {
    throw fail(409, 'MIN_PLACES', 'At least 2 active pickup points are needed.')
  }
  savePlaces(list.map(p => (p.id === id ? next : p)))
  return next
}

export function saveRules(adminId: string | null, body: any) {
  requireAdmin(adminId)
  const list: any[] = Array.isArray(body) ? body : []
  for (const t of ['Tricycle', 'Bao-bao']) {
    if (!list.some(r => r?.transport === t)) throw fail(422, 'VALIDATION', 'Fare rules are needed for Tricycle and Bao-bao.')
  }
  for (const r of list) {
    const bad = !Number.isInteger(r.baseFare) || r.baseFare < 5 || r.baseFare > 200
      || typeof r.perKm !== 'number' || !Number.isFinite(r.perKm) || r.perKm < 0 || r.perKm > 100
      || !Number.isInteger(r.range) || r.range < 0 || r.range > 50
    if (bad) {
      throw fail(422, 'VALIDATION', `Check the numbers for ${r.transport}: base fare 5 to 200, per km 0 to 100, range 0 to 50.`)
    }
  }
  const clean: FareRule[] = list.map(r => ({ transport: r.transport, baseFare: r.baseFare, perKm: r.perKm, range: r.range }))
  saveFareRules(clean)
  return fareRules()
}