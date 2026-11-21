<script setup lang="ts">
import type { FareOption } from '~/types/api'
import { useTransportService } from '~/services/transport'

const service = useTransportService()
const { data: places } = await useAsyncData('routes-places', () => service.places(), { server: false })
const { data: rules } = await useAsyncData('routes-rules', () => service.rules(), { server: false })

const from = ref('')
const to = ref('')
const fares = ref<FareOption[]>([])
const error = ref('')

watch([from, to], async () => {
  fares.value = []
  error.value = ''
  if (!from.value || !to.value) return
  if (from.value === to.value) {
    error.value = 'Choose two different places.'
    return
  }
  try {
    fares.value = await service.fares(from.value, to.value)
  } catch (e) {
    error.value = toApiError(e).message
  }
})
</script>

<template>
  <main style="max-width: 800px; margin: 0 auto; padding: 16px">
    <h1>Routes and fares</h1>
    <p>
      Fares are estimates based on straight-line distance. The final fare is agreed with the driver within the range shown.
      <NuxtLink to="/user/book">Book a ride</NuxtLink>
    </p>

    <h2>Check a fare</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px">
      <div>
        <label for="from">From</label>
        <select id="from" v-model="from" style="display: block; width: 100%; min-height: 44px">
          <option value="">Choose pickup point</option>
          <option v-for="p in places ?? []" :key="p.id" :value="p.id" :disabled="p.id === to">{{ p.name }}</option>
        </select>
      </div>
      <div>
        <label for="to">To</label>
        <select id="to" v-model="to" style="display: block; width: 100%; min-height: 44px">
          <option value="">Choose destination</option>
          <option v-for="p in places ?? []" :key="p.id" :value="p.id" :disabled="p.id === from">{{ p.name }}</option>
        </select>
      </div>
    </div>

    <p v-if="error" role="alert" style="color: #8a1c1c">{{ error }}</p>
    <table v-if="fares.length" style="margin-top: 16px; width: 100%; border-collapse: collapse">
      <caption style="text-align: left; font-weight: 600">Estimated fares</caption>
      <thead><tr><th align="left">Transport</th><th align="left">Fare</th><th align="left">Trip time</th></tr></thead>
      <tbody>
        <tr v-for="f in fares" :key="f.transport">
          <td>{{ f.transport }}</td>
          <td>₱{{ f.fareMin }} to ₱{{ f.fareMax }}</td>
          <td>about {{ f.minutes }} min</td>
        </tr>
      </tbody>
    </table>

    <h2>Pickup points</h2>
    <p v-if="!places">Loading...</p>
    <ul v-else>
      <li v-for="p in places" :key="p.id">{{ p.name }}</li>
    </ul>

    <h2>How fares are computed</h2>
    <table v-if="rules" style="width: 100%; border-collapse: collapse">
      <thead>
        <tr><th align="left">Transport</th><th align="left">Starting fare</th><th align="left">Added per km</th><th align="left">Range</th></tr>
      </thead>
      <tbody>
        <tr v-for="r in rules" :key="r.transport">
          <td>{{ r.transport }}</td>
          <td>₱{{ r.baseFare }}</td>
          <td>₱{{ r.perKm }}</td>
          <td>up to ₱{{ r.range }} more</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>