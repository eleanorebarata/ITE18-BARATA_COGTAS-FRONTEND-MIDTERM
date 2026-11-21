<script setup lang="ts">
const props = defineProps<{
  kind: 'user' | 'review'
  role: 'passenger' | 'driver'
  busy: boolean
  error: string
}>()
const emit = defineEmits<{ confirm: [payload: { category: string; description: string }] }>()

const dlg = ref<HTMLDialogElement>()
const category = ref('')
const description = ref('')
const localError = ref('')

const categories = computed(() =>
  reportCategories.filter(c => (props.kind === 'review' ? c.review : !c.review && c.for.includes(props.role)))
)

function open() {
  category.value = ''
  description.value = ''
  localError.value = ''
  dlg.value?.showModal()
}
function close() {
  dlg.value?.close()
}
defineExpose({ open, close })

function submit() {
  localError.value = ''
  if (!category.value) {
    localError.value = 'Choose a category.'
    return
  }
  if (description.value.trim().length < REPORT_MIN) {
    localError.value = `Please describe what happened (at least ${REPORT_MIN} characters).`
    return
  }
  emit('confirm', { category: category.value, description: description.value.trim() })
}
</script>

<template>
  <dialog ref="dlg" aria-labelledby="rp-title" style="max-width: 460px; width: 90%; border-radius: 12px; border: 1px solid #d1d5db; padding: 24px">
    <h2 id="rp-title" style="margin-top: 0">{{ kind === 'review' ? 'Report this review' : 'Report a problem' }}</h2>
    <p>An administrator will read your report. Please describe only what happened. False reports can lead to action on your account.</p>

    <p v-if="error || localError" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">
      {{ error || localError }}
    </p>

    <label for="rp-category">Category</label>
    <select id="rp-category" v-model="category" style="display: block; width: 100%; min-height: 44px">
      <option value="">Choose a category</option>
      <option v-for="c in categories" :key="c.code" :value="c.code">{{ c.label }}</option>
    </select>

    <label for="rp-desc" style="display: block; margin-top: 16px">What happened? (at least {{ REPORT_MIN }} characters)</label>
    <textarea id="rp-desc" v-model="description" rows="4" :maxlength="REPORT_MAX" style="display: block; width: 100%" />

    <div style="margin-top: 24px; display: flex; gap: 8px; justify-content: flex-end">
      <button type="button" style="min-height: 44px; padding: 0 16px" @click="close">Go back</button>
      <button type="button" :disabled="busy"
              style="min-height: 44px; padding: 0 16px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px"
              @click="submit">
        {{ busy ? 'Sending...' : 'Send report' }}
      </button>
    </div>
  </dialog>
</template>