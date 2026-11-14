import type { BookingStatus } from '~/types/api'

export const CANCEL_WINDOW_MINUTES = 30
export const MAX_STRIKES = 3

export interface CancelReason {
  code: string
  label: string
  needsNote?: boolean
  mayCount: boolean // may add a warning when cancelling an accepted ride
}

export const cancelReasons: CancelReason[] = [
  { code: 'driver_late', label: 'The driver is late or unreachable', mayCount: false },
  { code: 'wrong_details', label: 'I entered the wrong pickup or time', mayCount: false },
  { code: 'emergency', label: 'Emergency', mayCount: false },
  { code: 'changed_plans', label: 'My plans changed', mayCount: true },
  { code: 'found_other', label: 'I found other transport', mayCount: true },
  { code: 'other', label: 'Other (explain below)', mayCount: true, needsNote: true }
]

// open   = Pending, can always cancel
// window = Accepted and still inside the 30 minutes
// locked = Accepted and the 30 minutes have passed
// none   = Declined, Completed, or Cancelled
export function cancelState(status: BookingStatus, msLeft: number | null): 'open' | 'window' | 'locked' | 'none' {
  if (status === 'Pending') return 'open'
  if (status === 'Accepted') return msLeft !== null && msLeft > 0 ? 'window' : 'locked'
  return 'none'
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}