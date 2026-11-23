<script setup lang="ts">
import { useProfileService } from '~/services/profile'

defineProps<{ roleLabel: string }>()

const auth = useAuthStore()
const service = useProfileService()
const avatar = useAvatar()

const editing = ref(false)
const busy = ref(false)
const message = ref('')
const banner = ref('')
const errors = reactive<Record<string, string>>({})
const form = reactive({ name: '', contact: '' })
const savedContact = ref('')
const fileInput = ref<HTMLInputElement>()
// undefined = photo not changed, null = remove photo, string = new photo
const pending = ref<string | null | undefined>(undefined)

const initial = computed(() => (auth.user?.name ?? '?').charAt(0).toUpperCase())
const preview = computed(() => (pending.value === undefined ? avatar.value : pending.value))

onMounted(async () => {
  try {
    const p = await service.get()
    savedContact.value = p.contact
    avatar.value = p.avatar
  } catch {
    // The card still works without the saved photo.
  }
})

function clearErrors() {
  Object.keys(errors).forEach(k => delete errors[k])
  banner.value = ''
}

function startEdit() {
  clearErrors()
  message.value = ''
  form.name = auth.user?.name ?? ''
  form.contact = savedContact.value
  pending.value = undefined
  editing.value = true
}

function cancel() {
  clearErrors()
  pending.value = undefined
  editing.value = false
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  delete errors.avatar
  if (!file.type.startsWith('image/')) {
    errors.avatar = 'Choose a picture (JPG or PNG).'
    return
  }
  if (file.size > 8 * 1024 * 1024) {
    errors.avatar = 'That picture is too big. Choose one under 8 MB.'
    return
  }
  try {
    pending.value = await resizeToDataUrl(file)
  } catch (err: any) {
    errors.avatar = err?.message ?? 'Could not read this picture.'
  }
}

async function save() {
  clearErrors()
  busy.value = true
  try {
    const body: { name: string; contact: string; avatar?: string | null } = {
      name: form.name.trim(),
      contact: form.contact.trim()
    }
    if (pending.value !== undefined) body.avatar = pending.value
    const updated = await service.update(body)
    if (auth.user) auth.user = { ...auth.user, name: updated.name }
    savedContact.value = updated.contact
    avatar.value = updated.avatar
    pending.value = undefined
    editing.value = false
    message.value = 'Profile saved.'
  } catch (e) {
    const err = toApiError(e)
    if (err.fields) Object.assign(errors, err.fields)
    banner.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="card profile">
    <div class="big-avatar" style="overflow: hidden; padding: 0" :aria-hidden="!preview">
      <img v-if="preview" :src="preview" alt="Your profile picture" style="width: 100%; height: 100%; object-fit: cover" />
      <template v-else>{{ initial }}</template>
    </div>

    <template v-if="!editing">
      <span class="tag">{{ auth.status === 'suspended' ? 'Suspended' : 'Active' }}</span>
      <h1 style="margin: 8px 0 0; font-size: 1.4rem">{{ auth.user?.name }}</h1>
      <p class="meta" style="font-size: 0.85rem">{{ roleLabel }}</p>
      <p class="meta">{{ auth.user?.email }}</p>
      <p v-if="savedContact" class="meta">{{ savedContact }}</p>
      <slot />
      <p v-if="message" role="status" style="background: #e6f2ea; padding: 10px; border-radius: 8px; margin: 12px 0 0">{{ message }}</p>
      <button type="button" class="btn-outline" style="margin-top: 14px" @click="startEdit">Edit profile</button>
    </template>

    <form v-else novalidate style="text-align: left; margin-top: 14px" @submit.prevent="save">
      <p v-if="banner" role="alert" style="background: #fbeaea; color: #9b1c1c; padding: 10px; border-radius: 8px">{{ banner }}</p>

      <div class="card-actions" style="justify-content: center; margin-bottom: 12px">
        <button type="button" @click="fileInput?.click()">{{ preview ? 'Change photo' : 'Add photo' }}</button>
        <button v-if="preview" type="button" class="btn-danger" @click="pending = null">Remove photo</button>
      </div>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
      <p v-if="errors.avatar" role="alert" style="color: #9b1c1c; text-align: center">{{ errors.avatar }}</p>

      <div style="margin-bottom: 12px">
        <label for="p-name">Full name</label>
        <input id="p-name" v-model="form.name" class="search" autocomplete="name" :aria-invalid="!!errors.name" />
        <small v-if="errors.name" style="color: #9b1c1c">{{ errors.name }}</small>
      </div>
      <div style="margin-bottom: 12px">
        <label for="p-contact">Contact number</label>
        <input id="p-contact" v-model="form.contact" class="search" inputmode="numeric" placeholder="09123456789"
               autocomplete="tel" :aria-invalid="!!errors.contact" />
        <small v-if="errors.contact" style="color: #9b1c1c">{{ errors.contact }}</small>
      </div>
      <div>
        <label for="p-email">Email</label>
        <input id="p-email" :value="auth.user?.email" class="search" disabled />
        <small class="meta">Email cannot be changed here.</small>
      </div>

      <div class="card-actions">
        <button type="submit" class="btn-primary" :disabled="busy">{{ busy ? 'Saving...' : 'Save changes' }}</button>
        <button type="button" :disabled="busy" @click="cancel">Cancel</button>
      </div>
    </form>
  </div>
</template>