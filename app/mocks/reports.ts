import { reportCategories, REPORT_MIN, REPORT_MAX } from '~/utils/reportPolicy'
import { fail } from './errors'
import { read, write } from './storage'
import { allUsers } from './drivers'
import { findBooking } from './bookings'
import { findReview } from './reviews'
import { requireAdmin } from './admin'
import { resolveReasons, dismissReasons } from '~/utils/adminPolicy'

const KEY = 'csu_mock_reports'
const load = () => read<any[]>(KEY, [])
const labelOf = (code: string) => reportCategories.find(c => c.code === code)?.label ?? code
const nameOf = (id: string | null) => allUsers().find(u => u.id === id)?.name ?? 'Unknown'

export function createReport(userId: string | null, body: any) {
  const me = allUsers().find(u => u.id === userId)
  if (!me || (me.role !== 'passenger' && me.role !== 'driver')) throw fail(403, 'FORBIDDEN', 'You cannot send reports.')

  const targetType = body?.targetType
  if (!['driver', 'passenger', 'review'].includes(targetType)) throw fail(422, 'VALIDATION', 'Invalid report type.')

  const cat = reportCategories.find(c => c.code === body?.category)
  const categoryOk = cat && (targetType === 'review' ? cat.review : !cat.review && cat.for.includes(me.role))
  const description = String(body?.description ?? '').trim()

  const fields: Record<string, string> = {}
  if (!categoryOk) fields.category = 'Choose a category'
  if (description.length < REPORT_MIN) fields.description = `Write at least ${REPORT_MIN} characters`
  else if (description.length > REPORT_MAX) fields.description = `Write at most ${REPORT_MAX} characters`
  if (Object.keys(fields).length) throw fail(422, 'VALIDATION', Object.values(fields)[0]!, fields)

  let bookingId: string | null = body?.bookingId ?? null
  let reviewId: string | null = null
  let targetUserId: string | null = null

  if (targetType === 'review') {
    const rv = findReview(String(body?.reviewId ?? ''))
    if (!rv) throw fail(404, 'NOT_FOUND', 'Review not found.')
    reviewId = rv.id
    bookingId = rv.bookingId
    targetUserId = rv.driverId
  } else {
    const b = findBooking(String(bookingId ?? ''))
    if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')
    if (targetType === 'driver') {
      if (me.role !== 'passenger' || !b.driver || (b.passengerId && b.passengerId !== userId)) {
        throw fail(403, 'FORBIDDEN', 'You cannot report this.')
      }
      targetUserId = b.driver.id
    } else {
      if (me.role !== 'driver' || b.driver?.id !== userId) throw fail(403, 'FORBIDDEN', 'You cannot report this.')
      targetUserId = b.passengerId ?? null
    }
  }

  const list = load()
  const duplicate = list.some(r =>
    r.reporterId === userId && r.targetType === targetType && r.bookingId === bookingId && r.reviewId === reviewId
  )
  if (duplicate) throw fail(409, 'ALREADY_REPORTED', 'You already sent this report.')

  const report = {
    id: `r-${Date.now()}`,
    reporterId: userId,
    reporterRole: me.role,
    targetType,
    targetUserId,
    bookingId,
    reviewId,
    category: cat!.code,
    description,
    status: 'Open',
    adminNote: '',
    createdAt: new Date().toISOString()
  }
  write(KEY, [report, ...list])
  return { id: report.id, status: report.status }
}

export function myReports(userId: string | null) {
  return load()
    .filter(r => r.reporterId === userId)
    .map(r => ({
      id: r.id,
      targetType: r.targetType,
      categoryLabel: labelOf(r.category),
      status: r.status,
      createdAt: r.createdAt
    }))
}

export function adminReports(adminId: string | null, q: Record<string, string>) {
  requireAdmin(adminId)
  return load()
    .filter(r => !q.status || r.status === q.status)
    .map(r => ({
      id: r.id,
      status: r.status,
      categoryLabel: labelOf(r.category),
      description: r.description,
      reporterName: nameOf(r.reporterId),
      reporterRole: r.reporterRole,
      targetType: r.targetType,
      targetName: nameOf(r.targetUserId),
      bookingId: r.bookingId,
      reviewId: r.reviewId,
      reviewHidden: r.reviewId ? !!findReview(r.reviewId)?.hidden : undefined,
      adminNote: r.adminNote,
      createdAt: r.createdAt
    }))
}

export function adminUpdateReport(adminId: string | null, id: string, body: any) {
  requireAdmin(adminId)
  const list = load()
  const r = list.find(x => x.id === id)
  if (!r) throw fail(404, 'NOT_FOUND', 'Report not found.')

  const status = body?.status
  if (!['Under review', 'Resolved', 'Dismissed'].includes(status)) throw fail(422, 'VALIDATION', 'Invalid status.')

  let adminNote = r.adminNote
  if (status !== 'Under review') {
    const reasons = status === 'Resolved' ? resolveReasons : dismissReasons
    const reason = reasons.find(x => x.code === body?.reasonCode)
    if (!reason) throw fail(422, 'VALIDATION', 'Choose a reason.', { reasonCode: 'Choose a reason' })
    const note = String(body?.note ?? '').trim()
    if (reason.needsNote && note.length < 10) {
      throw fail(422, 'VALIDATION', 'Please explain in at least 10 characters.', { note: 'At least 10 characters' })
    }
    adminNote = note ? `${reason.label}: ${note}` : reason.label
  }

  r.status = status
  r.adminNote = adminNote
  write(KEY, list)
  return { id: r.id, status: r.status }
}