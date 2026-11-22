<script setup lang="ts">
import type { FareOption, Place } from '~/types/api'
import { useTransportService } from '~/services/transport'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const auth = useAuthStore()
const service = useTransportService()

const first = computed(() => (auth.user?.name ?? '').split(' ')[0] || 'there')

type RouteRow = { from: Place; to: Place; fares: FareOption[] }

const { data, pending } = await useAsyncData('home-data', async () => {
  const places = await service.places()
  const pairs: [Place, Place][] = []
  for (let i = 0; i < places.length && pairs.length < 3; i++) {
    const a = places[i]
    const b = places[(i + 1) % places.length]
    if (a && b && a.id !== b.id) pairs.push([a, b])
  }
  const routes: RouteRow[] = await Promise.all(
    pairs.map(async ([from, to]) => ({ from, to, fares: await service.fares(from.id, to.id) }))
  )
  return { places, routes }
}, { server: false })
</script>

<template>
  <div>
    <section class="hero">
      <div class="inner">
        <p class="eyebrow">Good day</p>
        <h1>Welcome, {{ first }}</h1>
        <p>Explore campus places, transportation routes, and estimated fares. Use the Booking tab when you are ready to request a ride.</p>
      </div>
    </section>

    <main class="page">
      <p v-if="pending">Loading...</p>

      <template v-else-if="data">
        <div class="section-head">
          <div><p class="eyebrow">Nearby on campus</p><h2>Popular places</h2></div>
          <NuxtLink to="/user/places" class="btn-outline">View places</NuxtLink>
        </div>
        <div class="h-scroll">
          <article v-for="p in data.places" :key="p.id" class="card flush">
            <div class="photo" />
            <div class="pad">
              <strong>{{ p.name }}</strong>
              <p class="meta">{{ p.address ?? 'CSU Main Campus' }}</p>
            </div>
          </article>
        </div>

        <div class="section-head">
          <div><p class="eyebrow">Campus navigation</p><h2>Routes and Location Map</h2></div>
        </div>
        <div class="card">
          <p class="eyebrow">Interactive map</p>
          <h3 style="margin-top: 2px">Routes and location markers</h3>
          <p class="meta">Pan and zoom the map. Tap a marker to see the place name.</p>
          <ClientOnly>
            <BookingMapPicker :places="data.places" :pickup-id="null" :destination-id="null" @select="() => {}" />
            <template #fallback><p>Loading map...</p></template>
          </ClientOnly>
        </div>

        <div class="section-head">
          <div><p class="eyebrow">Popular routes</p><h2>Available transportation</h2></div>
          <NuxtLink to="/routes" class="btn-outline">Browse all</NuxtLink>
        </div>
        <article v-for="r in data.routes" :key="r.from.id + r.to.id" class="card flush">
          <div class="photo tall" />
          <div class="pad">
            <div class="route-line">
              <span>{{ r.from.name }}</span><span class="arrow" aria-hidden="true">&rarr;</span><span>{{ r.to.name }}</span>
            </div>
            <div v-for="f in r.fares" :key="f.transport" class="route-block">
              <div class="route-line">
                <span>{{ f.transport }}</span>
                <span class="pill">&#8369;{{ f.fareMin }}&ndash;&#8369;{{ f.fareMax }}</span>
              </div>
              <p class="meta">About {{ f.minutes }} min</p>
            </div>
          </div>
        </article>
      </template>
    </main>
  </div>
</template>