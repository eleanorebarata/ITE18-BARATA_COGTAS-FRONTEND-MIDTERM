<script setup lang="ts">
import { z } from 'zod'
import type { Role } from '~/types/api'
import { useAuthService } from '~/services/auth'

const props = defineProps<{ role: Role; title: string }>()

const auth = useAuthStore()
const authService = useAuthService()

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})
const banner = ref('')
const loading = ref(false)

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
  <main style="max-width: 400px; margin: 48px auto; padding: 0 16px">
    <h1>{{ title }}</h1>

    <p v-if="banner" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">
      {{ banner }}
    </p>

    <form novalidate @submit.prevent="submit">
      <label for="email">Email</label>
      <input id="email" v-model="form.email" type="email" autocomplete="email"
             :aria-invalid="!!errors.email" style="display: block; width: 100%; min-height: 44px" />
      <small v-if="errors.email" style="color: #8a1c1c">{{ errors.email }}</small>

      <label for="password" style="display: block; margin-top: 16px">Password</label>
      <input id="password" v-model="form.password" type="password" autocomplete="current-password"
             :aria-invalid="!!errors.password" style="display: block; width: 100%; min-height: 44px" />
      <small v-if="errors.password" style="color: #8a1c1c">{{ errors.password }}</small>

      <button type="submit" :disabled="loading"
              style="margin-top: 24px; width: 100%; min-height: 44px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px">
        {{ loading ? 'Logging in...' : 'Log in' }}
      </button>
          <p v-if="role === 'passenger'" style="margin-top: 16px">
      No account yet? <NuxtLink to="/auth/user-register">Create one</NuxtLink>
    </p>
    <p v-if="role === 'driver'" style="margin-top: 16px">
      New driver? <NuxtLink to="/auth/driver-register">Register your vehicle</NuxtLink>
    </p>
    </form>
  </main>
</template>