<script setup lang="ts">
import { useReportService } from '~/services/reports'

const props = defineProps<{
  targetType: 'driver' | 'passenger' | 'review'
  label: string
  bookingId?: string
  reviewId?: string
}>()

const auth = useAuthStore()
const service = useReportService()

const dialog = ref<any>(null)
const busy = ref(false)
const error = ref('')
const done = ref('')

const role = computed<'passenger' | 'driver'>(() => (auth.role === 'driver' ? 'driver' : 'passenger'))
const kind = computed(() => (props.targetType === 'review' ? 'review' : 'user'))

function open() {
  error.value = ''
  dialog.value?.open()
}

async function send(p: { category: string; description: string }) {
  busy.value = true
  error.value = ''
  try {
    await service.create({
      targetType: props.targetType,
      bookingId: props.bookingId,
      reviewId: props.reviewId,
      category: p.category,
      description: p.description
    })
    dialog.value?.close()
    done.value = 'Report sent. You can follow it under My reports.'
  } catch (e) {
    const err = toApiError(e)
    if (err.code === 'ALREADY_REPORTED') {
      dialog.value?.close()
      done.value = err.message
    } else {
      error.value = Object.values(err.fields ?? {})[0] ?? err.message
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <span>
    <button type="button" style="min-height: 44px; padding: 0 16px" @click="open">{{ label }}</button>
    <span v-if="done" role="status" style="margin-left: 8px">{{ done }}</span>
    <ReportDialog ref="dialog" :kind="kind" :role="role" :busy="busy" :error="error" @confirm="send" />
  </span>
</template>