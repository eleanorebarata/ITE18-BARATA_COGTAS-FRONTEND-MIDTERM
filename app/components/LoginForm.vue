<script setup lang="ts">
import { z } from 'zod'
import type { Role } from '~/types/api'
import { useAuthService } from '~/services/auth'

const props = defineProps<{ role: Role; title?: string }>()

const auth = useAuthStore()
const authService = useAuthService()

const tabs = [
  { to: '/auth/user-login', label: 'Passenger' },
  { to: '/auth/driver-login', label: 'Driver' },
  { to: '/auth/admin-login', label: 'Administrator' }
]

const copy = {
  passenger: { sub: 'For students, commuters, and campus visitors.', label: 'Email', ph: 'Enter your email', create: '/auth/user-register' },
  driver: { sub: 'For approved CSU Mobility drivers.', label: 'Email', ph: 'Enter your email', create: '/auth/driver-register' },
  admin: { sub: 'For authorized CSU Mobility administrators.', label: 'CSU administrator email', ph: 'Enter your @carsu.edu.ph email', create: '' }
} as const

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})
const banner = ref('')
const loading = ref(false)
const showPw = ref(false)

const schema = computed(() =>
  z.object({
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email')
      .refine(v => props.role !== 'admin' || v.toLowerCase().endsWith('@carsu.edu.ph'), 'Admin email must end with @carsu.edu.ph'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
)

async function submit() {
  banner.value = ''
  errors.email = undefined
  errors.password = undefined

  const result = schema.value.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as 'email' | 'password'
      errors[key] ??= issue.message
    }
    return
  }

  loading.value = true
  try {
    const res = await authService.login(props.role, { email: form.email.trim(), password: form.password })
    auth.setSession(res)
    await navigateTo(res.status === 'suspended' ? '/account/suspended' : homeFor(res.role))
  } catch (e) {
    const err = toApiError(e)
    if (err.fields) Object.assign(errors, err.fields)
    banner.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-panel">
    <div class="auth-head">
      <BrandMark :size="38" />
      <div><strong>CSU Mobility</strong><small>Caraga State University</small></div>
    </div>

    <p class="eyebrow">Welcome back</p>
    <h1>Log in</h1>
    <p class="lead">{{ copy[role].sub }}</p>

    <AuthTabs :tabs="tabs" />

    <p v-if="banner" role="alert" style="background: #fbeaea; color: #9b1c1c; padding: 12px; border-radius: 10px">
      {{ banner }}
    </p>

    <form novalidate @submit.prevent="submit">
      <div style="margin-bottom: 14px">
        <label for="email">{{ copy[role].label }}</label>
        <input id="email" v-model="form.email" type="email" autocomplete="email" :placeholder="copy[role].ph"
               :aria-invalid="!!errors.email" style="width: 100%" />
        <small v-if="errors.email" style="color: #9b1c1c">{{ errors.email }}</small>
      </div>

      <div style="margin-bottom: 18px">
        <label for="password">Password</label>
        <div class="pw">
          <input id="password" v-model="form.password" :type="showPw ? 'text' : 'password'" autocomplete="current-password"
                 placeholder="Enter your password" :aria-invalid="!!errors.password" />
          <button type="button" class="toggle" :aria-pressed="showPw" @click="showPw = !showPw">{{ showPw ? 'Hide' : 'Show' }}</button>
        </div>
        <small v-if="errors.password" style="color: #9b1c1c">{{ errors.password }}</small>
      </div>

      <button type="submit" class="btn-primary btn-block" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Log in' }}
      </button>
    </form>

    <p v-if="copy[role].create" class="center" style="margin-top: 16px">
      <NuxtLink :to="copy[role].create">Create account</NuxtLink>
    </p>
  </main>
</template>