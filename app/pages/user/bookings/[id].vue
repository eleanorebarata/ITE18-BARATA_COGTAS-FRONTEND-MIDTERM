<script setup lang="ts">
import type { Booking, Standing } from '~/types/api'
import { useBookingService } from '~/services/bookings'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const route = useRoute()
const id = route.params.id as string
const service = useBookingService()
const auth = useAuthStore()
const config = useRuntimeConfig()

const booking = ref<Booking | null>(null)
const standing = ref<Standing>({ strikeCount: 0, status: 'active', suspendedUntil: null })
const loading = ref(true)
const loadError = ref('')
const banner = ref('')
const dialogError = ref('')
const busy = ref(false)
const offset = ref(0) // server time minus this phone's time
const now = ref(Date.now())
const dialog = ref<any>(null)
let timer: ReturnType<typeof setInterval>

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [b, s] = await Promise.all([service.get(id), service.standing()])
    booking.value = b
    standing.value = s
    offset.value = new Date(b.serverNow).getTime() - Date.now()
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  timer = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const msLeft = computed(() =>
  booking.value?.cancelableUntil
    ? new Date(booking.value.cancelableUntil).getTime() - (now.value + offset.value)
    : null
)
const state = computed(() => (booking.value ? cancelState(booking.value.status, msLeft.value) : 'none'))

function openDialog() {
  dialogError.value = ''
  dialog.value?.open()
}

async function confirmCancel(payload: { reasonCode: string; note: string }) {
  busy.value = true
  dialogError.value = ''
  try {
    const res = await service.cancel(id, payload)
    booking.value = res.booking
    standing.value = res.standing
    dialog.value?.close()
    if (res.standing.status === 'suspended') {
      auth.status = 'suspended'
      auth.suspendedUntil = res.standing.suspendedUntil
      await navigateTo('/account/suspended')
      return
    }
    banner.value = 'Your booking was cancelled.'
  } catch (e) {
    const err = toApiError(e)
    if (err.code === 'CANCEL_WINDOW_CLOSED' || err.code === 'NOT_CANCELLABLE') {
      dialog.value?.close()
      banner.value = err.message
      await load()
    } else {
      dialogError.value = err.message
    }
  } finally {
    busy.value = false
  }
}

async function simulateAccept(minutesAgo: number) {
  await service.devAccept(id, minutesAgo)
  banner.value = ''
  await load()
}

async function resetWarnings() {
  standing.value = await service.devResetStanding()
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main style="max-width: 640px; margin: 0 auto; padding: 16px">
    <NuxtLink to="/user/bookings">&larr; My bookings</NuxtLink>
    <h1>Booking details</h1>

    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #8a1c1c">{{ loadError }}</p>

    <template v-else-if="booking">
      <p v-if="banner" role="status" style="background: #fdf3cc; padding: 12px; border-radius: 8px">{{ banner }}</p>

      <section style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px">
        <StatusBadge :status="booking.status" />
        <h2 style="font-size: 18px; margin: 8px 0">{{ booking.pickup }} to {{ booking.destination }}</h2>
        <p style="margin: 0">{{ when(booking.pickupAt) }} &middot; {{ booking.passengers }} passenger(s) &middot; {{ booking.transport }}</p>
        <p v-if="booking.fareMin" style="margin: 4px 0 0">Fare: &#8369;{{ booking.fareMin }} to &#8369;{{ booking.fareMax }}</p>
        <p v-if="booking.driver" style="margin: 12px 0 0">
          Driver: {{ booking.driver.name }}<br />
          Vehicle: {{ booking.driver.vehicleType }}, plate {{ booking.driver.plateNumber }}
        </p>
      </section>

      <section style="margin-top: 16px">
     <p v-if="booking.status === 'Declined' && booking.declineMessage" role="status"
         style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px; margin-top: 16px">
        {{ booking.declineMessage }}
      </p>
        <h2>Cancellation</h2>
        <p>Warnings: {{ standing.strikeCount }} of {{ MAX_STRIKES }}</p>

        <template v-if="state === 'open'">
          <p>Your request is pending. You can cancel it for free.</p>
          <button style="min-height: 44px; padding: 0 24px; background: #8a1c1c; color: #fff; border: 0; border-radius: 8px" @click="openDialog">Cancel booking</button>
        </template>

        <template v-else-if="state === 'window'">
          <p>
            The driver accepted. You can cancel for
            <strong>{{ formatCountdown(msLeft ?? 0) }}</strong> more.
            After that, cancelling is closed.
          </p>
          <button style="min-height: 44px; padding: 0 24px; background: #8a1c1c; color: #fff; border: 0; border-radius: 8px" @click="openDialog">Cancel booking</button>
        </template>

        <template v-else-if="state === 'locked'">
          <p>Cancellation is closed, because more than {{ CANCEL_WINDOW_MINUTES }} minutes passed since the driver accepted.</p>
          <button disabled style="min-height: 44px; padding: 0 24px">Cancellation closed</button>
        </template>

        <p v-else>This booking can no longer be cancelled.</p>
      </section>
      
      <DriverTracker :booking="booking" />
      <BookingExtras :booking="booking" />
      <section v-if="config.public.useMock" style="margin-top: 32px; border: 2px dashed #b58900; border-radius: 12px; padding: 16px">
        <strong>Testing tools (mock only, removed before the Final)</strong>
        <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px">
          <button v-if="booking.status === 'Pending'" @click="simulateAccept(0)">Driver accepts now</button>
          <button v-if="booking.status === 'Pending'" @click="simulateAccept(45)">Driver accepted 45 min ago</button>
          <button @click="resetWarnings">Reset warnings</button>
        </div>
      </section>

      <CancelDialog ref="dialog" :strike-count="standing.strikeCount" :busy="busy" :error="dialogError" @confirm="confirmCancel" />
    </template>
  </main>
</template>