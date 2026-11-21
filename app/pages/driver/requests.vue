<script setup lang="ts">
import type { Booking, DriverProfile } from '~/types/api'
import { useDriverService } from '~/services/driver'

definePageMeta({ middleware: ['auth', 'role'], role: 'driver' })

const auth = useAuthStore()
const service = useDriverService()
const config = useRuntimeConfig()

const profile = ref<DriverProfile | null>(null)
const bookings = ref<Booking[]>([])
const loading = ref(true)
const loadError = ref('')
const banner = ref('')
const busyId = ref('')
const tab = ref<'requests' | 'schedule' | 'history'>('requests')

const dialog = ref<any>(null)
const declineId = ref('')
const dialogError = ref('')
const dialogBusy = ref(false)

async function load() {
  try {
    const [p, b] = await Promise.all([service.profile(), service.bookings()])
    profile.value = p
    bookings.value = b
    loadError.value = ''
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const requests = computed(() => bookings.value.filter(b => b.status === 'Pending'))
const schedule = computed(() => bookings.value.filter(b => b.status === 'Accepted'))
const history = computed(() => bookings.value.filter(b => ['Completed', 'Declined', 'Cancelled'].includes(b.status)))
const tabLabels = { requests: 'Requests', schedule: 'Schedule', history: 'History' } as const
const counts = computed(() => ({ requests: requests.value.length, schedule: schedule.value.length, history: history.value.length }))
const shown = computed(() => ({ requests: requests.value, schedule: schedule.value, history: history.value })[tab.value])
const emptyText = { requests: 'No pending requests right now.', schedule: 'No accepted rides yet.', history: 'Nothing in your history yet.' }

async function accept(id: string) {
  busyId.value = id
  banner.value = ''
  try {
    await service.accept(id)
    banner.value = 'Request accepted. It is now in your Schedule.'
  } catch (e) {
    banner.value = toApiError(e).message
  } finally {
    busyId.value = ''
    await load()
  }
}

async function complete(id: string) {
  busyId.value = id
  banner.value = ''
  try {
    await service.complete(id)
    banner.value = 'Ride marked as completed.'
  } catch (e) {
    banner.value = toApiError(e).message
  } finally {
    busyId.value = ''
    await load()
  }
}

function openDecline(id: string) {
  declineId.value = id
  dialogError.value = ''
  dialog.value?.open()
}

async function confirmDecline(payload: { reasonCode: string; note: string }) {
  dialogBusy.value = true
  dialogError.value = ''
  try {
    await service.decline(declineId.value, payload)
    dialog.value?.close()
    banner.value = 'Request declined.'
    await load()
  } catch (e) {
    const err = toApiError(e)
    if (err.code === 'NOT_PENDING') {
      dialog.value?.close()
      banner.value = err.message
      await load()
    } else {
      dialogError.value = err.message
    }
  } finally {
    dialogBusy.value = false
  }
}

async function verify() {
  profile.value = await service.devVerify()
}

function logout() {
  auth.logout()
  navigateTo('/auth/driver-login')
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main style="max-width: 640px; margin: 0 auto; padding: 16px">
    <h1>Driver</h1>

    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #8a1c1c">{{ loadError }}</p>

    <template v-else-if="profile">
      <p style="margin: 0">{{ profile.name }} &middot; {{ profile.vehicleType }} &middot; Plate <strong>{{ profile.plateNumber }}</strong></p>
      <DriverLocationShare :has-active-ride="schedule.length > 0" />
      <p v-if="!profile.plateVerified" role="status" style="background: #fdf3cc; padding: 12px; border-radius: 8px; margin-top: 16px">
        Your plate number is waiting for administrator verification. You cannot accept requests yet.
      </p>

      <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px; border-radius: 8px">{{ banner }}</p>

      <div role="tablist" style="display: flex; gap: 8px; margin: 24px 0 16px">
        <button v-for="(label, key) in tabLabels" :key="key" role="tab" :aria-selected="tab === key"
                :style="{ minHeight: '44px', padding: '0 16px', fontWeight: tab === key ? '700' : '400', background: tab === key ? '#e6f2ea' : '#fff', border: '1px solid #d1d5db', borderRadius: '8px' }"
                @click="tab = key as typeof tab">
          {{ label }} ({{ counts[key] }})
        </button>
      </div>

      <p v-if="!shown.length">{{ emptyText[tab] }}</p>

      <ul v-else style="list-style: none; padding: 0; margin: 0">
        <li v-for="b in shown" :key="b.id" style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 12px">
          <StatusBadge :status="b.status" />
          <h2 style="font-size: 18px; margin: 8px 0">{{ b.pickup }} to {{ b.destination }}</h2>
          <p style="margin: 0">{{ when(b.pickupAt) }} &middot; {{ b.passengers }} passenger(s) &middot; {{ b.transport }}</p>
          <p v-if="b.fareMin" style="margin: 4px 0 0">Fare: &#8369;{{ b.fareMin }} to &#8369;{{ b.fareMax }}</p>
          <p v-if="b.passengerName" style="margin: 4px 0 0">Passenger: {{ b.passengerName }}</p>
          <div v-if="tab !== 'requests' && b.driver" style="margin-top: 8px">
            <ReportButton :booking-id="b.id" target-type="passenger" label="Report passenger" />
          </div>

          <div v-if="tab === 'requests'" style="margin-top: 12px; display: flex; gap: 8px">
            <button :disabled="!profile.plateVerified || busyId === b.id"
                    style="min-height: 44px; padding: 0 20px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px"
                    @click="accept(b.id)">
              {{ busyId === b.id ? 'Working...' : 'Accept' }}
            </button>
            <button :disabled="busyId === b.id"
                    style="min-height: 44px; padding: 0 20px; background: #fff; color: #8a1c1c; border: 2px solid #8a1c1c; border-radius: 8px"
                    @click="openDecline(b.id)">
              Decline
            </button>
          </div>

          <div v-else-if="tab === 'schedule'" style="margin-top: 12px">
            <button :disabled="busyId === b.id"
                    style="min-height: 44px; padding: 0 20px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px"
                    @click="complete(b.id)">
              Mark as completed
            </button>
          </div>
        </li>
      </ul>

<section v-if="config.public.useMock && config.public.showDevTools" style="margin-top: 32px; border: 2px dashed #b58900; border-radius: 12px; padding: 16px">
        <strong>Testing tools (mock only)</strong>
        <div style="margin-top: 8px">
          <button :disabled="profile.plateVerified" @click="verify">Pretend the admin verified my plate</button>
        </div>
      </section>

      <ReasonDialog
        ref="dialog"
        title="Decline this request?"
        intro="The passenger will see a short, friendly message based on your reason. Please choose an honest reason."
        :reasons="declineReasons"
        confirm-label="Decline request"
        :busy="dialogBusy"
        :error="dialogError"
        @confirm="confirmDecline"
      />
    </template>
  </main>
</template>