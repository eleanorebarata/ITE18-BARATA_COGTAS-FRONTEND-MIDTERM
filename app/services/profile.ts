export interface MyProfile {
  id: string
  name: string
  email: string
  contact: string
  avatar: string | null
}

export function useProfileService() {
  const api = useApi()
  return {
    get: () => api<MyProfile>('/me/profile'),
    update: (body: { name: string; contact: string; avatar?: string | null }) =>
      api<MyProfile>('/me/profile', { method: 'PATCH', body })
  }
}