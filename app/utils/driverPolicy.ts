export interface DeclineReason {
  code: string
  label: string
  passengerText: string
  needsNote?: boolean
}

export const declineReasons: DeclineReason[] = [
  { code: 'vehicle_problem', label: 'Vehicle problem', passengerText: 'The driver has a vehicle problem. Please try another ride.' },
  { code: 'ending_shift', label: 'I am ending my shift', passengerText: 'The driver is ending their shift. Please try another ride.' },
  { code: 'pickup_unreachable', label: 'The pickup point is unreachable', passengerText: 'The driver could not reach your pickup point. Please try another pickup point or ride.' },
  { code: 'over_capacity', label: 'Too many passengers for my vehicle', passengerText: 'The number of passengers is more than this vehicle can carry. Please try a smaller group or another ride.' },
  { code: 'safety_concern', label: 'Safety concern', passengerText: 'The driver could not accept this request. Please try another ride.' },
  { code: 'other', label: 'Other (explain below)', needsNote: true, passengerText: 'The driver could not accept this request. Please try another ride.' }
]