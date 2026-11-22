<script setup lang="ts">
import { useTransportService } from '~/services/transport'

definePageMeta({ middleware: ['auth', 'role'], role: 'passenger' })

const service = useTransportService()
const draft = useBookingDraftStore()

const { data: places, pending } = await useAsyncData('places-guide', () => service.places(), { server: false })

const q = ref('')
const sort = ref<'az' | 'za'>('az')

const shown = computed(() => {
  const term = q.value.trim().toLowerCase()
  const list = (places.value ?? []).filter(p =>
    !term
    || p.name.toLowerCase().includes(term)
    || (p.description ?? '').toLowerCase().includes(term)
    || (p.address ?? '').toLowerCase().includes(term)
  )
  return [...list].sort((a, b) => (sort.value === 'az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
})

async function bookFrom(id: string) {
  draft.reset()
  draft.pickupId = id
  await navigateTo('/user/book')
}
</script>

<template>
  <main class="page">
    <p class="eyebrow">Campus guide</p>
    <h1>Pickup points and destinations</h1>

    <div class="card">
      <label for="search">Search places</label>
      <input id="search" v-model="q" type="search" class="search" placeholder="Search places" />
      <label for="sort" style="margin-top: 12px">Sort</label>
      <select id="sort" v-model="sort" class="search">
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
      </select>
    </div>

    <p v-if="pending">Loading...</p>
    <template v-else>
      <p class="meta" role="status">{{ shown.length }} place{{ shown.length === 1 ? '' : 's' }} shown</p>
      <p v-if="!shown.length" class="empty">No places match your search.</p>

      <article v-for="p in shown" :key="p.id" class="card flush">
        <div class="photo tall" />
        <div class="pad">
          <span class="tag">Pickup point</span>
          <h2 style="margin: 8px 0 4px; font-size: 1.05rem">{{ p.name }}</h2>
          <p class="meta" style="font-size: 0.85rem">{{ p.description ?? 'Campus pickup and drop-off point.' }}</p>
          <p class="meta">{{ p.address ?? 'CSU Main Campus' }}</p>
          <button type="button" style="margin-top: 10px" @click="bookFrom(p.id)">Book from here</button>
        </div>
      </article>
    </template>
  </main>
</template>