export type BookingStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Cancelled'
export type AccountStatus = 'active' | 'suspended' | 'deactivated'
export type Role = 'passenger' | 'driver' | 'admin'

export interface Booking {
  id: string
  status: BookingStatus
  pickup: string
  destination: string
  passengers: number
  pickupAt: string
  acceptedAt: string | null
  cancelableUntil: string | null
  serverNow: string
  driver?: { id: string; name: string; plateNumber: string; vehicleType: string }
  transport?: string
  fareMin?: number
  fareMax?: number
  declineMessage?: string
  passengerName?: string
}

export interface CancelPayload {
  reasonCode: string
  note?: string
}

export interface ApiError {
  status: number
  code: string
  message: string
  fields?: Record<string, string>
}

export interface LoginResult {
  token: string
  role: Role
  status: AccountStatus
  suspendedUntil: string | null
  user: { id: string; name: string; email: string }
}
export interface Place {
  id: string
  name: string
  lat: number
  lng: number
  active?: boolean
}

export interface FareOption {
  transport: 'Tricycle' | 'Bao-bao'
  fareMin: number
  fareMax: number
  minutes: number
}

export interface CreateBookingPayload {
  pickupId: string
  destinationId: string
  transport: string
  pickupAt: string
  passengers: number
}
export interface Standing {
  strikeCount: number
  status: AccountStatus
  suspendedUntil: string | null
}

export interface CancelResult {
  booking: Booking
  standing: Standing
}
export interface DriverProfile {
  name: string
  plateNumber: string
  vehicleType: string
  plateVerified: boolean
}

export interface DriverRegisterPayload {
  name: string
  email: string
  contact: string
  plateNumber: string
  vehicleType: string
  password: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  status: AccountStatus
  contact?: string
  plateNumber?: string
  vehicleType?: string
  plateVerified?: boolean
  statusReason?: string
}

export interface AdminSummary {
  bookings: Record<BookingStatus, number>
  activeUsers: number
  suspendedUsers: number
  deactivatedUsers: number
  pendingPlates: number
}

export type ReportStatus = 'Open' | 'Under review' | 'Resolved' | 'Dismissed'

export interface Review {
  id: string
  bookingId: string
  driverId: string
  rating: number
  tags: string[]
  comment: string
  authorName: string
  createdAt: string
  hidden: boolean
}

export interface DriverReviews {
  driver: { id: string; name: string; plateNumber: string; vehicleType: string }
  average: number
  count: number
  reviews: Review[]
}

export interface CreateReviewPayload {
  rating: number
  tags: string[]
  comment: string
}

export interface CreateReportPayload {
  targetType: 'driver' | 'passenger' | 'review'
  category: string
  description: string
  bookingId?: string
  reviewId?: string
}

export interface MyReport {
  id: string
  targetType: 'driver' | 'passenger' | 'review'
  categoryLabel: string
  status: ReportStatus
  createdAt: string
}

export interface AdminReport {
  id: string
  status: ReportStatus
  categoryLabel: string
  description: string
  reporterName: string
  reporterRole: string
  targetType: 'driver' | 'passenger' | 'review'
  targetName: string
  bookingId: string | null
  reviewId: string | null
  reviewHidden?: boolean
  adminNote: string
  createdAt: string
}

export interface AdminCancellation {
  id: string
  route: string
  passengerName: string
  reason: string
  note: string
  pickupAt: string
  strikeCounted: boolean
  strikeRemoved: boolean
}

export interface LatLng {
  lat: number
  lng: number
}

export interface TrackingInfo {
  active: boolean
  pickup: (LatLng & { name: string }) | null
  driver: (LatLng & { updatedAt: string }) | null
  serverNow: string
}


export interface FareRule {
  transport: 'Tricycle' | 'Bao-bao'
  baseFare: number   // minimum fare in pesos
  perKm: number      // pesos added per kilometre
  range: number      // fareMax = fareMin + range
}