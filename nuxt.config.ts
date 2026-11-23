export default defineNuxtConfig({
  routeRules: { '/': { redirect: '/auth/user-login' } },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      useMock: true,         // set to false when the real API is ready
      showDevTools: true,    // the yellow "Testing tools" boxes; set to false for the final release
      apiBase: 'http://localhost:4000/api/v1'
    }
  }
})