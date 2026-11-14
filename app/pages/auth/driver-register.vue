<script setup lang="ts">
import { z } from 'zod'
import { useDriverService } from '~/services/driver'

const service = useDriverService()

const form = reactive<Record<string, string>>({
  name: '', email: '', contact: '', plateNumber: '', vehicleType: '', password: ''
})
const errors = reactive<Record<string, string>>({})
const banner = ref('')
const done = ref('')
const loading = ref(false)

const fields = [
  { key: 'name', label: 'Full name', type: 'text', auto: 'name' },
  { key: 'email', label: 'Email', type: 'email', auto: 'email' },
  { key: 'contact', label: 'Contact number (09XXXXXXXXX)', type: 'tel', auto: 'tel' },
  { key: 'plateNumber', label: 'Plate number', type: 'text', auto: 'off' },
  { key: 'password', label: 'Password (at least 8 characters)', type: 'password', auto: 'new-password' }
]

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  contact: z.string().trim().regex(/^09\d{9}$/, 'Use an 11-digit number starting with 09'),
  plateNumber: z.string().refine(isValidPlate, 'Use 5 to 10 letters, numbers, spaces, or dashes'),
  vehicleType: z.string().refine(v => v === 'Tricycle' || v === 'Bao-bao', 'Choose a vehicle type'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

async function submit() {
  banner.value = ''
  Object.keys(errors).forEach(k => delete errors[k])

  form.plateNumber = normalizePlate(form.plateNumber ?? '')
  const result = schema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0])
      errors[key] ??= issue.message
    }
    return
  }

  loading.value = true
  try {
    const res = await service.register({
      name: form.name!.trim(),
      email: form.email!.trim(),
      contact: form.contact!.trim(),
      plateNumber: form.plateNumber,
      vehicleType: form.vehicleType!,
      password: form.password!
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
  <main style="max-width: 400px; margin: 48px auto; padding: 0 16px">
    <h1>Driver registration</h1>

    <div v-if="done" role="status" style="background: #e6f2ea; padding: 16px; border-radius: 8px">
      <p>{{ done }}</p>
      <NuxtLink to="/auth/driver-login">Go to driver login</NuxtLink>
    </div>

    <template v-else>
      <p v-if="banner" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">{{ banner }}</p>

      <form novalidate @submit.prevent="submit">
        <div v-for="f in fields" :key="f.key" style="margin-bottom: 16px">
          <label :for="f.key">{{ f.label }}</label>
          <input :id="f.key" v-model="form[f.key]" :type="f.type" :autocomplete="f.auto"
                 :aria-invalid="!!errors[f.key]" style="display: block; width: 100%; min-height: 44px" />
          <small v-if="f.key === 'plateNumber' && !errors.plateNumber" style="color: #4b5563">
            Use the plate or franchise number shown on your vehicle.
          </small>
          <small v-if="errors[f.key]" style="color: #8a1c1c">{{ errors[f.key] }}</small>
        </div>

        <label for="vehicleType">Vehicle type</label>
        <select id="vehicleType" v-model="form.vehicleType" :aria-invalid="!!errors.vehicleType" style="display: block; width: 100%; min-height: 44px">
          <option value="">Choose vehicle type</option>
          <option value="Tricycle">Tricycle</option>
          <option value="Bao-bao">Bao-bao</option>
        </select>
        <small v-if="errors.vehicleType" style="color: #8a1c1c">{{ errors.vehicleType }}</small>

        <button type="submit" :disabled="loading"
                style="margin-top: 24px; width: 100%; min-height: 44px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px">
          {{ loading ? 'Sending...' : 'Register' }}
        </button>
      </form>
    </template>
  </main>
</template>