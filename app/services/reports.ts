import type { CreateReportPayload, MyReport } from '~/types/api'

export function useReportService() {
  const api = useApi()
  return {
    create: (body: CreateReportPayload) => api<{ id: string; status: string }>('/reports', { method: 'POST', body }),
    mine: () => api<MyReport[]>('/reports/mine')
  }
}