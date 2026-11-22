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
  <main class="page">
    <NuxtLink to="/user/bookings" class="back">&larr; Back to bookings</NuxtLink>

    <div class="stepper" role="img" :aria-label="`Step ${draft.step} of 3`">
      <template v-for="n in 3" :key="n">
        <span v-if="n > 1" class="bar" :class="{ 'is-on': draft.step >= n }" />
        <span class="dot" :class="{ 'is-on': draft.step >= n }">{{ n }}</span>
      </template>
    </div>

    <p class="eyebrow">Step {{ draft.step }} of 3</p>
    <h1>Book a ride</h1>

    <p v-if="banner" role="alert" style="background: #fbeaea; color: #9b1c1c; padding: 12px; border-radius: 10px">
      {{ banner }}
    </p>

    <!-- Step 1: where -->
    <section v-if="draft.step === 1" class="card">
      <h2 style="margin-top: 0">Pickup and destination</h2>
      <ClientOnly>
        <BookingMapPicker :places="places" :pickup-id="draft.pickupId" :destination-id="draft.destinationId" @select="choose" />
        <template #fallback><p>Loading map...</p></template>
      </ClientOnly>
      <p class="meta">Green marker: pickup. Maroon marker: destination. Tap a marker, or use the lists below.</p>

      <label for="pickup">Pickup point</label>
      <select id="pickup" v-model="draft.pickupId" style="display: block; width: 100%">
        <option :value="null">Choose pickup</option>
        <option v-for="p in places" :key="p.id" :value="p.id" :disabled="p.id === draft.destinationId">{{ p.name }}</option>
      </select>

      <label for="destination" style="margin-top: 16px">Destination</label>
      <select id="destination" v-model="draft.destinationId" style="display: block; width: 100%">
        <option :value="null">Choose destination</option>
        <option v-for="p in places" :key="p.id" :value="p.id" :disabled="p.id === draft.pickupId">{{ p.name }}</option>
      </select>

      <div v-if="fares.length" style="margin-top: 16px">
        <h3>Transport and fare</h3>
        <label v-for="f in fares" :key="f.transport" style="display: block; padding: 12px; border: 1px solid #d1d5db; border-radius: 10px; margin-bottom: 8px; font-weight: 500">
          <input v-model="draft.transport" type="radio" name="transport" :value="f.transport" />
          {{ f.transport }}: &#8369;{{ f.fareMin }} to &#8369;{{ f.fareMax }}, about {{ f.minutes }} min
        </label>
      </div>

      <button class="btn-primary btn-block" :disabled="!step1Ready" style="margin-top: 16px" @click="toStep2">Next</button>
    </section>

    <!-- Step 2: when and how many -->
    <section v-else-if="draft.step === 2" class="card">
      <h2 style="margin-top: 0">Date, time, and passengers</h2>

      <label for="when">Pickup date and time</label>
      <input id="when" v-model="draft.pickupAt" type="datetime-local" :min="minDate" style="display: block; width: 100%" />
      <small v-if="errors.pickupAt" style="color: #9b1c1c">{{ errors.pickupAt }}</small>

      <label for="pax" style="margin-top: 16px">Passengers (1 to 6)</label>
      <input id="pax" v-model.number="draft.passengers" type="number" min="1" max="6" style="display: block; width: 100%" />
      <small v-if="errors.passengers" style="color: #9b1c1c">{{ errors.passengers }}</small>

      <div class="card-actions">
        <button @click="draft.step = 1">Back</button>
        <button class="btn-primary" @click="toStep3">Next</button>
      </div>
    </section>

    <!-- Step 3: review -->
    <section v-else class="card">
      <h2 style="margin-top: 0">Review and confirm</h2>
      <div class="box"><span class="k">From</span><span class="v">{{ nameOf(draft.pickupId) }}</span></div>
      <div class="box"><span class="k">To</span><span class="v">{{ nameOf(draft.destinationId) }}</span></div>
      <div class="box"><span class="k">Transport</span><span class="v">{{ draft.transport }}</span></div>
      <div v-if="selectedFare" class="box">
        <span class="k">Estimated fare</span><span class="v">&#8369;{{ selectedFare.fareMin }} to &#8369;{{ selectedFare.fareMax }}</span>
      </div>
      <div class="box">
        <span class="k">Pickup</span>
        <span class="v">{{ new Date(draft.pickupAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
      </div>
      <div class="box"><span class="k">Passengers</span><span class="v">{{ draft.passengers }}</span></div>
      <p class="meta" style="margin-top: 12px">Cancelling an accepted booking is only allowed within 30 minutes after the driver accepts it.</p>

      <div class="card-actions">
        <button @click="draft.step = 2">Back</button>
        <button class="btn-primary" :disabled="saving" @click="confirm">
          {{ saving ? 'Sending...' : 'Confirm booking' }}
        </button>
      </div>
    </section>
  </main>
</template>