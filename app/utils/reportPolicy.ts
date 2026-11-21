export interface ReportCategory {
  code: string
  label: string
  for: ('passenger' | 'driver')[]
  review?: boolean // true = only used when reporting a review
}

export const reportCategories: ReportCategory[] = [
  { code: 'unsafe_driving', label: 'Unsafe driving', for: ['passenger'] },
  { code: 'overcharging', label: 'Overcharging', for: ['passenger'] },
  { code: 'harassment', label: 'Harassment or rude behavior', for: ['passenger', 'driver'] },
  { code: 'no_show', label: 'No-show', for: ['passenger', 'driver'] },
  { code: 'wrong_information', label: 'Wrong or false information', for: ['passenger', 'driver'] },
  { code: 'other', label: 'Other', for: ['passenger', 'driver'] },
  { code: 'offensive_review', label: 'Offensive or abusive review', for: ['passenger', 'driver'], review: true },
  { code: 'false_review', label: 'False or fake review', for: ['passenger', 'driver'], review: true },
  { code: 'other_review', label: 'Other', for: ['passenger', 'driver'], review: true }
]

export const REPORT_MIN = 20
export const REPORT_MAX = 500