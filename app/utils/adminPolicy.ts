export interface StatusReason {
  code: string
  label: string
  needsNote?: boolean
}

export const deactivateReasons: StatusReason[] = [
  { code: 'repeated_cancellations', label: 'Repeated cancellations without a valid reason' },
  { code: 'safety_report', label: 'Safety report confirmed' },
  { code: 'false_information', label: 'False information or fake account' },
  { code: 'user_request', label: 'The user asked to close the account' },
  { code: 'other', label: 'Other (explain below)', needsNote: true }
]

export const reactivateReasons: StatusReason[] = [
  { code: 'appeal_approved', label: 'Appeal approved' },
  { code: 'deactivated_by_mistake', label: 'Deactivated by mistake' },
  { code: 'suspension_ended', label: 'Suspension period ended' },
  { code: 'other', label: 'Other (explain below)', needsNote: true }
]

export const resolveReasons: StatusReason[] = [
  { code: 'user_warned', label: 'User warned' },
  { code: 'user_deactivated', label: 'User account deactivated' },
  { code: 'review_hidden', label: 'Review hidden' },
  { code: 'other', label: 'Other (explain below)', needsNote: true }
]

export const dismissReasons: StatusReason[] = [
  { code: 'not_enough_evidence', label: 'Not enough evidence' },
  { code: 'not_a_violation', label: 'Not a rule violation' },
  { code: 'duplicate_report', label: 'Duplicate report' },
  { code: 'other', label: 'Other (explain below)', needsNote: true }
]

export const excuseReasons: StatusReason[] = [
  { code: 'emergency_confirmed', label: 'Emergency confirmed' },
  { code: 'driver_fault', label: 'The driver was at fault' },
  { code: 'flagged_by_mistake', label: 'Flagged by mistake' },
  { code: 'other', label: 'Other (explain below)', needsNote: true }
]