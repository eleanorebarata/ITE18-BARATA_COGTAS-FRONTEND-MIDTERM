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