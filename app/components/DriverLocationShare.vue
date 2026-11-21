<script setup lang="ts">
import { useTrackingService } from '~/services/tracking'

const props = defineProps<{ hasActiveRide: boolean }>()
const service = useTrackingService()

const sharing = ref(false)
const error = ref('')
const lastSent = ref<Date | null>(null)
let watchId: number | null = null
let lastSentAt = 0

function clearWatch() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  watchId = null
}

async function push(pos: GeolocationPosition) {
  const now = Date.now()
  if (now - lastSentAt < SHARE_EVERY_MS) return
  lastSentAt = now
  try {
    await service.send({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    lastSent.value = new Date()
    error.value = ''
  } catch (e) {
    const err = toApiError(e)
    error.value = err.message
    if (err.code === 'NO_ACTIVE_RIDE') await stop()
  }
}

function onGeoError(e: GeolocationPositionError) {
  if (e.code === 1) {
    error.value = 'Location permission was denied. Allow location access in your browser to share.'
    clearWatch()
    sharing.value = false
  } else if (e.code === 2) {
    error.value = 'Your location is unavailable right now.'
  } else {
    error.value = 'Getting your location took too long. Trying again.'
  }
}

function start() {
  error.value = ''
  if (!('geolocation' in navigator)) {
    error.value = 'This browser cannot share location.'
    return
  }
  sharing.value = true
  lastSentAt = 0
  watchId = navigator.geolocation.watchPosition(push, onGeoError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000
  })
}

async function stop() {
  clearWatch()
  sharing.value = false
  try {
    await service.stop()
  } catch {
    // The server drops old positions by itself, so a failed stop is not fatal.
  }
}

// If the ride ends or is cancelled, stop sharing automatically.
watch(() => props.hasActiveRide, (active) => {
  if (!active && sharing.value) stop()
})

onBeforeUnmount(clearWatch)
</script>

<template>
  <section style="margin-top: 16px; border: 1px solid #d1d5db; border-radius: 12px; padding: 16px">
    <h2 style="margin-top: 0; font-size: 18px">Share my location</h2>

    <p v-if="!hasActiveRide">
      You can share your location once you accept a ride. Passengers see it only while their own ride is accepted.
    </p>

    <template v-else>
      <p v-if="sharing" role="status">
        Sharing your location with the passenger of your accepted ride.
        <span v-if="lastSent">Last sent {{ lastSent.toLocaleTimeString('en-PH') }}.</span>
      </p>
      <p v-else>Sharing is off. Turn it on so your passenger can see you arrive.</p>

      <button type="button" :aria-pressed="sharing" style="min-height: 44px; padding: 0 20px" @click="sharing ? stop() : start()">
        {{ sharing ? 'Stop sharing' : 'Share my location' }}
      </button>
    </template>

    <p v-if="error" role="alert" style="color: #8a1c1c">{{ error }}</p>
  </section>
</template>