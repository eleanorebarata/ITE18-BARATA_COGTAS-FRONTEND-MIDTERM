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