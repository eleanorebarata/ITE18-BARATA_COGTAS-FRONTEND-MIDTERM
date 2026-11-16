import { fail } from './errors'
import { allUsers } from './drivers'
import { listBookings } from './bookings'
import { read, write, OVERRIDES_KEY } from './storage'
import type { MockUser } from './users'
import { deactivateReasons, reactivateReasons } from '~/utils/adminPolicy'

function requireAdmin(userId: string | null) {
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