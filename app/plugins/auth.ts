export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const saved = useCookie<any>('csu_session', { maxAge: 60 * 60 * 8, sameSite: 'lax' })

  if (saved.value && !auth.token) auth.$patch(saved.value)

  auth.$subscribe((_mutation, state) => {
    saved.value = state.token ? { ...state } : null
  })
})