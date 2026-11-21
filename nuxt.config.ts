export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      useMock: true,         // set to false when the real API is ready
      showDevTools: true,    // the yellow "Testing tools" boxes; set to false for the final release
      apiBase: 'http://localhost:4000/api/v1'
    }
  }
})