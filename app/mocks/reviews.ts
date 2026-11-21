import { reviewTags, MAX_COMMENT } from '~/utils/reviewPolicy'
import { fail } from './errors'
import { read, write } from './storage'
import { allUsers } from './drivers'
import { findBooking } from './bookings'
import { requireAdmin } from './admin'

const KEY = 'csu_mock_reviews'
const load = () => read<any[]>(KEY, [])

export const findReview = (id: string) => load().find(r => r.id === id)

const publicReview = (r: any) => ({
  id: r.id, bookingId: r.bookingId, driverId: r.driverId, rating: r.rating, tags: r.tags,
  comment: r.comment, authorName: r.authorName, createdAt: r.createdAt, hidden: !!r.hidden
})

export function getReviewForBooking(userId: string | null, bookingId: string) {
  const r = load().find(x => x.bookingId === bookingId)
  return r ? publicReview(r) : null
}

export function createReview(userId: string | null, bookingId: string, body: any) {
  const b = findBooking(bookingId)
  if (!b) throw fail(404, 'NOT_FOUND', 'Booking not found.')
  if (b.passengerId && b.passengerId !== userId) throw fail(403, 'FORBIDDEN', 'This is not your booking.')
  if (b.status !== 'Completed' || !b.driver) {
    throw fail(409, 'NOT_COMPLETED', 'You can rate a ride after it is completed.')
  }
  if (load().some(r => r.bookingId === bookingId)) {
    throw fail(409, 'ALREADY_REVIEWED', 'You already rated this ride.')
  }

  const rating = Number(body?.rating)
  const comment = String(body?.comment ?? '').trim()
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t: any) => reviewTags.includes(t)) : []

  const fields: Record<string, string> = {}
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fields.rating = 'Choose 1 to 5 stars'
  if (comment.length > MAX_COMMENT) fields.comment = `At most ${MAX_COMMENT} characters`
  if (Object.keys(fields).length) throw fail(422, 'VALIDATION', Object.values(fields)[0]!, fields)

  const me = allUsers().find(u => u.id === userId)
  const review = {
    id: `rv-${Date.now()}`,
    bookingId,
    driverId: b.driver.id,
    rating,
    tags,
    comment,
    authorName: me ? me.name.split(' ')[0] : 'Passenger',
    createdAt: new Date().toISOString(),
    hidden: false
  }
  write(KEY, [review, ...load()])
  return publicReview(review)
}

export function driverReviews(driverId: string) {
  const driver = allUsers().find(u => u.id === driverId && u.role === 'driver')
  if (!driver) throw fail(404, 'NOT_FOUND', 'Driver not found.')
  const visible = load().filter(r => r.driverId === driverId && !r.hidden)
  const count = visible.length
  const average = count ? Math.round((visible.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0
  return {
    driver: { id: driver.id, name: driver.name, plateNumber: driver.plateNumber ?? '', vehicleType: driver.vehicleType ?? '' },
    average,
    count,
    reviews: visible.map(publicReview)
  }
}

export function setReviewHidden(adminId: string | null, id: string, body: any) {
  requireAdmin(adminId)
  const list = load()
  const r = list.find(x => x.id === id)
  if (!r) throw fail(404, 'NOT_FOUND', 'Review not found.')
  r.hidden = !!body?.hidden
  write(KEY, list)
  return publicReview(r)
}