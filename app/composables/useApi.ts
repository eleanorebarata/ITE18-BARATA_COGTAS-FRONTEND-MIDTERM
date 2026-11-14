import { mockFetch } from '~/mocks'

type ApiFn = <T = any>(path: string, opts?: { method?: string; body?: any; query?: Record<string, string> }) => Promise<T>

export function useApi(): ApiFn {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

    if (config.public.useMock) {
    return ((path: string, opts?: any) => mockFetch(path, { ...opts, token: auth.token })) as ApiFn
  }

  const client = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (auth.token) {
        const headers = new Headers(options.headers as HeadersInit)
        headers.set('Authorization', `Bearer ${auth.token}`)
        options.headers = headers
      }
    },
    onResponseError({ response }) {
      const code = response._data?.code
      if (response.status === 401 || code === 'ACCOUNT_DEACTIVATED') {
        auth.logout()
        navigateTo('/auth/user-login')
      }
    }
  })
  return client as unknown as ApiFn
}