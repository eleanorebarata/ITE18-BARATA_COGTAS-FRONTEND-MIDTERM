import type { ApiError } from '~/types/api'

export function toApiError(e: any): ApiError {
  return {
    status: e?.statusCode ?? e?.status ?? 0,
    code: e?.data?.code ?? (e?.statusCode ? 'UNKNOWN' : 'NETWORK'),
    message: e?.data?.message ?? 'Something went wrong. Please try again.',
    fields: e?.data?.fields
  }
}