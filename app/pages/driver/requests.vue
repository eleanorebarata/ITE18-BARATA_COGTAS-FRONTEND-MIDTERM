<script setup lang="ts">
import type { Booking, DriverProfile } from '~/types/api'
import { useDriverService } from '~/services/driver'

definePageMeta({ middleware: ['auth', 'role'], role: 'driver' })

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

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main class="page">
    <p class="eyebrow">Driver workspace</p>
    <h1>Good day, {{ profile?.name ?? 'driver' }}</h1>

    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #9b1c1c">{{ loadError }}</p>

    <template v-else-if="profile">
      <p v-if="!profile.plateVerified" role="status" style="background: #fdf3cc; padding: 12px; margin-bottom: 12px">
        Your plate number is waiting for administrator verification. You cannot accept requests yet.
      </p>
      <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px; margin-bottom: 12px">{{ banner }}</p>

      <div class="segmented" role="tablist">
        <button v-for="(label, key) in tabLabels" :key="key" type="button" role="tab" :aria-selected="tab === key"
                :class="{ 'is-active': tab === key }" @click="tab = key as typeof tab">
          {{ label }} ({{ counts[key] }})
        </button>
      </div>

      <p v-if="!shown.length" class="empty">{{ emptyText[tab] }}</p>

      <article v-for="b in shown" v-else :key="b.id" class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
          <span class="meta">{{ b.transport }}</span>
          <StatusBadge :status="b.status" />
        </div>
        <h2 style="font-size: 1.05rem; margin: 6px 0 4px">{{ b.pickup }} &rarr; {{ b.destination }}</h2>
        <p class="meta">{{ when(b.pickupAt) }} &middot; {{ b.passengers }} passenger(s)</p>

        <div v-if="b.passengerName" class="box"><span class="k">Passenger</span><span class="v">{{ b.passengerName }}</span></div>
        <div v-if="b.fareMin" class="box"><span class="k">Estimated fare</span><span class="v">&#8369;{{ b.fareMin }}&ndash;&#8369;{{ b.fareMax }}</span></div>

        <div v-if="tab !== 'requests' && b.driver" style="margin-top: 8px">
          <ReportButton :booking-id="b.id" target-type="passenger" label="Report passenger" />
        </div>

        <div v-if="tab === 'requests'" class="card-actions">
          <button type="button" class="btn-primary" :disabled="!profile.plateVerified || busyId === b.id" @click="accept(b.id)">
            {{ busyId === b.id ? 'Working...' : 'Accept' }}
          </button>
          <button type="button" :disabled="busyId === b.id" @click="openDecline(b.id)">Decline</button>
        </div>

        <div v-else-if="tab === 'schedule'" class="card-actions">
          <button type="button" class="btn-primary" :disabled="busyId === b.id" @click="complete(b.id)">Mark as completed</button>
        </div>
      </article>

      <DriverLocationShare :has-active-ride="schedule.length > 0" />

      <section v-if="config.public.useMock && config.public.showDevTools" style="margin-top: 24px; border: 2px dashed #b58900; border-radius: 12px; padding: 16px">
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