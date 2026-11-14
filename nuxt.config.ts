export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      useMock: true,                            // set to false when the real API is ready
      apiBase: 'http://localhost:4000/api/v1'   // placeholder: ask the backend team for the real URL
    }
  }
})