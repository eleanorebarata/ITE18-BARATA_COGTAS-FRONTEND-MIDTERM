<script setup lang="ts">
import type { FareOption } from '~/types/api'
import { useBookingService } from '~/services/bookings'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const draft = useBookingDraftStore()
const service = useBookingService()

const { data: placesData } = await useAsyncData('places', () => service.places())
const places = computed(() => placesData.value ?? [])

const fares = ref<FareOption[]>([])
const banner = ref('')
const saving = ref(false)
const errors = reactive({ pickupAt: '', passengers: '' })
const minDate = ref('')

onMounted(() => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  minDate.value = d.toISOString().slice(0, 16)
})

watch(
  () => [draft.pickupId, draft.destinationId],
  async ([from, to]) => {
    fares.value = []
    draft.transport = ''
    if (from && to && from !== to) {
      try {
        fares.value = await service.fares(from, to)
      } catch (e) {
        banner.value = toApiError(e).message
      }
    }
  },
  { immediate: true }
)

const nameOf = (id: string | null) => places.value.find(p => p.id === id)?.name ?? ''
const selectedFare = computed(() => fares.value.find(f => f.transport === draft.transport))
const step1Ready = computed(() => !!draft.pickupId && !!draft.destinationId && !!draft.transport)

function choose(id: string) {
  if (!draft.pickupId || draft.destinationId) {
    draft.pickupId = id
    draft.destinationId = null
  } else if (id !== draft.pickupId) {
    draft.destinationId = id
  }
}

function toStep2() {
  banner.value = ''
  draft.step = 2
}

function toStep3() {
  errors.pickupAt = ''
  errors.passengers = ''
  const when = new Date(draft.pickupAt)
  if (!draft.pickupAt || isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    errors.pickupAt = 'Choose a pickup date and time in the future.'
  }
  const n = Number(draft.passengers)
  if (!Number.isInteger(n) || n < 1 || n > 6) errors.passengers = 'Passengers must be from 1 to 6.'
  if (errors.pickupAt || errors.passengers) return
  draft.step = 3
}

async function confirm() {
  saving.value = true
  banner.value = ''
  try {
    await service.create({
      pickupId: draft.pickupId!,
      destinationId: draft.destinationId!,
      transport: draft.transport,
      pickupAt: new Date(draft.pickupAt).toISOString(),
      passengers: draft.passengers
    })
    draft.reset()
    await navigateTo('/user/bookings')
  } catch (e) {
    const err = toApiError(e)
    banner.value = Object.values(err.fields ?? {})[0] ?? err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main style="max-width: 640px; margin: 0 auto; padding: 16px">
    <NuxtLink to="/user/bookings">&larr; My bookings</NuxtLink>
    <h1>Book a ride</h1>
    <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="3" :aria-valuenow="draft.step" :aria-label="`Step ${draft.step} of 3`">
      <span :style="{ width: (draft.step / 3) * 100 + '%' }" />
    </div>
    <p style="margin: 0">Step {{ draft.step }} of 3</p>

    <p v-if="banner" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">
      {{ banner }}
    </p>

    <!-- Step 1: where -->
    <section v-if="draft.step === 1">
      <h2>Pickup and destination</h2>
      <ClientOnly>
        <BookingMapPicker :places="places" :pickup-id="draft.pickupId" :destination-id="draft.destinationId" @select="choose" />
        <template #fallback><p>Loading map...</p></template>
      </ClientOnly>
      <p>Green marker: pickup. Maroon marker: destination. Tap a marker, or use the lists below.</p>

      <label for="pickup">Pickup point</label>
      <select id="pickup" v-model="draft.pickupId" style="display: block; width: 100%; min-height: 44px">
        <option :value="null">Choose pickup</option>
        <option v-for="p in places" :key="p.id" :value="p.id" :disabled="p.id === draft.destinationId">{{ p.name }}</option>
      </select>

      <label for="destination" style="display: block; margin-top: 16px">Destination</label>
      <select id="destination" v-model="draft.destinationId" style="display: block; width: 100%; min-height: 44px">
        <option :value="null">Choose destination</option>
        <option v-for="p in places" :key="p.id" :value="p.id" :disabled="p.id === draft.pickupId">{{ p.name }}</option>
      </select>

      <div v-if="fares.length" style="margin-top: 16px">
        <h3>Transport and fare</h3>
        <label v-for="f in fares" :key="f.transport" style="display: block; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; margin-bottom: 8px">
          <input v-model="draft.transport" type="radio" name="transport" :value="f.transport" />
          {{ f.transport }}: &#8369;{{ f.fareMin }} to &#8369;{{ f.fareMax }}, about {{ f.minutes }} min
        </label>
      </div>

      <button :disabled="!step1Ready" style="margin-top: 16px; min-height: 44px; padding: 0 24px" @click="toStep2">Next</button>
    </section>

    <!-- Step 2: when and how many -->
    <section v-else-if="draft.step === 2">
      <h2>Date, time, and passengers</h2>

      <label for="when">Pickup date and time</label>
      <input id="when" v-model="draft.pickupAt" type="datetime-local" :min="minDate" style="display: block; width: 100%; min-height: 44px" />
      <small v-if="errors.pickupAt" style="color: #8a1c1c">{{ errors.pickupAt }}</small>

      <label for="pax" style="display: block; margin-top: 16px">Passengers (1 to 6)</label>
      <input id="pax" v-model.number="draft.passengers" type="number" min="1" max="6" style="display: block; width: 100%; min-height: 44px" />
      <small v-if="errors.passengers" style="color: #8a1c1c">{{ errors.passengers }}</small>

      <div style="margin-top: 16px">
        <button style="min-height: 44px; padding: 0 24px" @click="draft.step = 1">Back</button>
        <button style="min-height: 44px; padding: 0 24px; margin-left: 8px" @click="toStep3">Next</button>
      </div>
    </section>

    <!-- Step 3: review -->
    <section v-else>
      <h2>Review and confirm</h2>
      <ul>
        <li>From: {{ nameOf(draft.pickupId) }}</li>
        <li>To: {{ nameOf(draft.destinationId) }}</li>
        <li>Transport: {{ draft.transport }}</li>
        <li v-if="selectedFare">Estimated fare: &#8369;{{ selectedFare.fareMin }} to &#8369;{{ selectedFare.fareMax }}</li>
        <li>Pickup: {{ new Date(draft.pickupAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) }}</li>
        <li>Passengers: {{ draft.passengers }}</li>
      </ul>
      <p>Cancelling an accepted booking is only allowed within 30 minutes after the driver accepts it.</p>

      <button style="min-height: 44px; padding: 0 24px" @click="draft.step = 2">Back</button>
      <button :disabled="saving" style="min-height: 44px; padding: 0 24px; margin-left: 8px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px" @click="confirm">
        {{ saving ? 'Sending...' : 'Confirm booking' }}
      </button>
    </section>
  </main>
</template>