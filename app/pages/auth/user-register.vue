<script setup lang="ts">
import { z } from 'zod'
import { useAuthService } from '~/services/auth'

const service = useAuthService()

const regTabs = [
  { to: '/auth/user-register', label: 'Passenger' },
  { to: '/auth/driver-register', label: 'Driver' }
]

const form = reactive<Record<string, string>>({ name: '', email: '', contact: '', password: '' })
const errors = reactive<Record<string, string>>({})
const banner = ref('')
const done = ref('')
const loading = ref(false)

const fields = [
  { key: 'name', label: 'Full name', type: 'text', auto: 'name' },
  { key: 'email', label: 'Email', type: 'email', auto: 'email' },
  { key: 'contact', label: 'Contact number (09XXXXXXXXX)', type: 'tel', auto: 'tel' },
  { key: 'password', label: 'Password (8+ characters)', type: 'password', auto: 'new-password' }
]

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  contact: z.string().trim().regex(/^09\d{9}$/, 'Use an 11-digit number starting with 09'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

async function submit() {
  banner.value = ''
  Object.keys(errors).forEach(k => delete errors[k])

  const result = schema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] ??= issue.message
    }
    return
  }

  loading.value = true
  try {
    const res = await service.register({
      name: form.name!.trim(), email: form.email!.trim(),
      contact: form.contact!.trim(), password: form.password!
    })
    done.value = res.message
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
  <main style="max-width: 420px">
        <AuthBrand />
    <NuxtLink to="/auth/user-login" class="back">&larr; Back to login</NuxtLink>
    <p class="eyebrow">Join CSU Mobility</p>
    <h1>Create account</h1>
    <AuthTabs :tabs="regTabs" />

    <div v-if="done" role="status" style="background: #e6f2ea; padding: 16px; border-radius: 10px">
      <p style="margin-top: 0">{{ done }}</p>
      <NuxtLink to="/auth/user-login">Go to login</NuxtLink>
    </div>

    <template v-else>
      <p v-if="banner" role="alert" style="background: #fbeaea; color: #9b1c1c; padding: 12px; border-radius: 10px">{{ banner }}</p>

      <form novalidate class="form-grid" @submit.prevent="submit">
        <div v-for="f in fields" :key="f.key">
          <label :for="f.key">{{ f.label }} <span aria-hidden="true" style="color: #9b1c1c">*</span></label>
          <input :id="f.key" v-model="form[f.key]" :type="f.type" :autocomplete="f.auto"
                 :aria-invalid="!!errors[f.key]" style="width: 100%" />
          <small v-if="errors[f.key]" style="color: #9b1c1c">{{ errors[f.key] }}</small>
        </div>

        <button type="submit" class="btn-primary full" :disabled="loading">
          {{ loading ? 'Creating...' : 'Register' }}
        </button>
      </form>
    </template>
  </main>
</template>