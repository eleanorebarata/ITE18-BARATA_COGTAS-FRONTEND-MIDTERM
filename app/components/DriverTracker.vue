<script setup lang="ts">
import type { Booking, TrackingInfo } from '~/types/api'
import { useTrackingService } from '~/services/tracking'

const props = defineProps<{ booking: Booking }>()

const config = useRuntimeConfig()
const service = useTrackingService()

const info = ref<TrackingInfo | null>(null)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined
let busy = false

async function poll() {
  if (busy) return
  busy = true
  try {
    info.value = await service.forBooking(props.booking.id)
    error.value = ''
  } catch (e) {
    error.value = toApiError(e).message
  } finally {
    busy = false
  }
}

function stopPolling() {
  if (timer) clearInterval(timer)
  timer = undefined
}

function startPolling() {
  stopPolling()
  if (props.booking.status === 'Accepted') {
    poll()
    timer = setInterval(poll, POLL_EVERY_MS)
  }
}

onMounted(startPolling)
watch(() => props.booking.status, startPolling)
onBeforeUnmount(stopPolling)

const age = computed(() => (info.value?.driver ? ageSeconds(info.value.driver.updatedAt, info.value.serverNow) : 0))
const stale = computed(() => !!info.value?.driver && age.value * 1000 > STALE_AFTER_MS)
const distance = computed(() =>
  info.value?.driver && info.value.pickup ? distanceKm(info.value.driver, info.value.pickup) : null
)

async function moveDriver() {
  await service.devMove(props.booking.id)
  await poll()
}
</script>

<template>
  <section v-if="booking.status === 'Accepted'" style="margin-top: 16px">
    <h2>Driver location</h2>

    <p v-if="error" role="alert" style="color: #8a1c1c">{{ error }}</p>
    <p v-else-if="!info">Loading...</p>

    <template v-else>
      <p v-if="!info.driver" role="status">Waiting for the driver to share their location.</p>
      <p v-else-if="stale" role="status" style="background: #fdf3cc; padding: 12px; border-radius: 8px">
        The driver's location was last updated {{ age }} seconds ago, so it may be out of date.
      </p>
      <p v-else-if="distance !== null" role="status">
        Your driver is about {{ formatDistance(distance) }} from the pickup point (straight-line distance).
      </p>

      <ClientOnly>
        <TrackingMap v-if="info.pickup" :pickup="info.pickup" :driver="info.driver" />
        <template #fallback><p>Loading map...</p></template>
      </ClientOnly>
    </template>

  <div v-if="config.public.useMock && config.public.showDevTools" style="margin-top: 16px;  border: 2px dashed #b58900; border-radius: 12px; padding: 16px">
      <strong>Testing tools (mock only, removed before the Final)</strong>
      <div style="margin-top: 8px">
        <button type="button" @click="moveDriver">Move driver closer</button>
      </div>
    </div>
  </section>
</template>