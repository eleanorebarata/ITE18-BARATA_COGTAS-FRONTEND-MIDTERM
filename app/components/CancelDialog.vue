<script setup lang="ts">
const props = defineProps<{ strikeCount: number; busy: boolean; error: string }>()
const emit = defineEmits<{ confirm: [payload: { reasonCode: string; note: string }] }>()

const dlg = ref<HTMLDialogElement>()
const reasonCode = ref('')
const note = ref('')
const localError = ref('')

const reason = computed(() => cancelReasons.find(r => r.code === reasonCode.value))

function open() {
  reasonCode.value = ''
  note.value = ''
  localError.value = ''
  dlg.value?.showModal()
}
function close() {
  dlg.value?.close()
}
defineExpose({ open, close })

function submit() {
  localError.value = ''
  if (!reason.value) {
    localError.value = 'Choose a reason.'
    return
  }
  if (reason.value.needsNote && note.value.trim().length < 10) {
    localError.value = 'Please explain in at least 10 characters.'
    return
  }
  emit('confirm', { reasonCode: reasonCode.value, note: note.value.trim() })
}
</script>

<template>
  <dialog ref="dlg" aria-labelledby="cancel-title" style="max-width: 440px; width: 90%; border-radius: 12px; border: 1px solid #d1d5db; padding: 24px">
    <h2 id="cancel-title" style="margin-top: 0">Cancel this booking?</h2>
    <p>
      Cancelling after a driver accepted without a valid reason adds a warning.
      You have <strong>{{ props.strikeCount }} of {{ MAX_STRIKES }}</strong> warnings.
      At {{ MAX_STRIKES }} warnings your account is suspended for 7 days.
    </p>

    <p v-if="error || localError" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">
      {{ error || localError }}
    </p>

    <label for="reason">Reason</label>
    <select id="reason" v-model="reasonCode" style="display: block; width: 100%; min-height: 44px">
      <option value="">Choose a reason</option>
      <option v-for="r in cancelReasons" :key="r.code" :value="r.code">{{ r.label }}</option>
    </select>

    <template v-if="reason?.needsNote">
      <label for="note" style="display: block; margin-top: 16px">Explain (at least 10 characters)</label>
      <textarea id="note" v-model="note" rows="3" maxlength="300" style="display: block; width: 100%" />
    </template>

    <div style="margin-top: 24px; display: flex; gap: 8px; justify-content: flex-end">
      <button type="button" style="min-height: 44px; padding: 0 16px" @click="close">Keep booking</button>
      <button type="button" :disabled="busy" style="min-height: 44px; padding: 0 16px; background: #8a1c1c; color: #fff; border: 0; border-radius: 8px" @click="submit">
        {{ busy ? 'Cancelling...' : 'Cancel booking' }}
      </button>
    </div>
  </dialog>
</template>