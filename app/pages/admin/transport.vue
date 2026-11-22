<script setup lang="ts">
import type { FareRule, Place } from '~/types/api'
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const route = useRoute()
const service = useAdminService()
const { data: places, refresh: refreshPlaces, pending } = await useAsyncData('admin-places', () => service.places(), { server: false })
const { data: rulesData, refresh: refreshRules } = await useAsyncData('admin-rules', () => service.fareRules(), { server: false })

const tab = ref<'locations' | 'map' | 'fares'>(route.query.tab === 'fares' ? 'fares' : 'locations')
const tabLabels = { locations: 'Locations', map: 'Map', fares: 'Fare rules' } as const

const rules = ref<FareRule[]>([])
watch(rulesData, (v) => { if (v) rules.value = v.map(r => ({ ...r })) }, { immediate: true })

const activeOnly = computed(() => (places.value ?? []).filter(p => p.active !== false))

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', lat: '', lng: '' })
const errors = reactive<Record<string, string>>({})
const banner = ref('')
const message = ref('')
const rulesBanner = ref('')
const rulesMessage = ref('')

function resetForm() {
  editingId.value = null
  showForm.value = false
  form.name = ''
  form.lat = ''
  form.lng = ''
  Object.keys(errors).forEach(k => delete errors[k])
}

function startEdit(p: Place) {
  editingId.value = p.id
  showForm.value = true
  form.name = p.name
  form.lat = String(p.lat)
  form.lng = String(p.lng)
  message.value = ''
  banner.value = ''
}

async function submitPlace() {
  banner.value = ''
  message.value = ''
  Object.keys(errors).forEach(k => delete errors[k])
  const body = { name: form.name.trim(), lat: Number(form.lat), lng: Number(form.lng) }
  try {
    const editing = !!editingId.value
    if (editingId.value) await service.updatePlace(editingId.value, body)
    else await service.addPlace(body)
    message.value = editing ? 'Pickup point updated.' : 'Pickup point added.'
    resetForm()
    await refreshPlaces()
  } catch (e) {
    const err = toApiError(e)
    if (err.fields) Object.assign(errors, err.fields)
    banner.value = err.message
  }
}

async function toggle(p: Place) {
  banner.value = ''
  message.value = ''
  try {
    await service.updatePlace(p.id, { active: p.active === false })
    message.value = p.active === false ? 'Pickup point reactivated.' : 'Pickup point deactivated.'
    await refreshPlaces()
  } catch (e) {
    banner.value = toApiError(e).message
  }
}

async function saveRules() {
  rulesBanner.value = ''
  rulesMessage.value = ''
  try {
    await service.saveFareRules(rules.value)
    rulesMessage.value = 'Fare rules saved. They apply to new bookings only.'
    await refreshRules()
  } catch (e) {
    rulesBanner.value = toApiError(e).message
  }
}
</script>

<template>
  <main class="page">
    <p class="eyebrow">Transport management</p>
    <h1>Routes and fares</h1>

    <div class="segmented" role="tablist">
      <button v-for="(label, key) in tabLabels" :key="key" type="button" role="tab" :aria-selected="tab === key"
              :class="{ 'is-active': tab === key }" @click="tab = key as typeof tab">{{ label }}</button>
    </div>

    <!-- Locations -->
    <section v-if="tab === 'locations'">
      <div class="page-head">
        <div><p class="eyebrow">Location records</p><h2 style="margin: 2px 0 0">Locations</h2></div>
        <button v-if="!showForm" type="button" class="btn-primary" @click="showForm = true">+ Add location</button>
      </div>

      <p v-if="banner" role="alert" style="background: #fbeaea; color: #9b1c1c; padding: 12px; margin-top: 12px">{{ banner }}</p>
      <p v-if="message" role="status" style="background: #e6f2ea; padding: 12px; margin-top: 12px">{{ message }}</p>

      <form v-if="showForm" novalidate class="card" style="margin-top: 12px" @submit.prevent="submitPlace">
        <h3 style="margin-top: 0">{{ editingId ? 'Edit pickup point' : 'Add pickup point' }}</h3>
        <div style="margin-bottom: 12px">
          <label for="pname">Name</label>
          <input id="pname" v-model="form.name" class="search" :aria-invalid="!!errors.name" />
          <small v-if="errors.name" style="color: #9b1c1c">{{ errors.name }}</small>
        </div>
        <div style="margin-bottom: 12px">
          <label for="plat">Latitude (example: 8.9552)</label>
          <input id="plat" v-model="form.lat" class="search" inputmode="decimal" :aria-invalid="!!errors.lat" />
          <small v-if="errors.lat" style="color: #9b1c1c">{{ errors.lat }}</small>
        </div>
        <div style="margin-bottom: 12px">
          <label for="plng">Longitude (example: 125.5975)</label>
          <input id="plng" v-model="form.lng" class="search" inputmode="decimal" :aria-invalid="!!errors.lng" />
          <small v-if="errors.lng" style="color: #9b1c1c">{{ errors.lng }}</small>
        </div>
        <div class="card-actions" style="margin-top: 0">
          <button type="submit" class="btn-primary">{{ editingId ? 'Save changes' : 'Add' }}</button>
          <button type="button" @click="resetForm">Cancel</button>
        </div>
      </form>

      <p v-if="pending" style="margin-top: 12px">Loading...</p>
      <article v-for="p in places ?? []" v-else :key="p.id" class="card" style="margin-top: 12px">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px">
          <strong>{{ p.name }}</strong>
          <span class="tag" :class="{ 'st-deactivated': p.active === false }">{{ p.active === false ? 'Deactivated' : 'Active' }}</span>
        </div>
        <p class="meta">{{ p.description ?? 'Campus pickup point' }}</p>
        <p class="meta">{{ p.lat }}, {{ p.lng }}</p>
        <div class="card-actions">
          <button type="button" @click="startEdit(p)">Edit</button>
          <button type="button" :class="{ 'btn-danger': p.active !== false }" @click="toggle(p)">
            {{ p.active === false ? 'Reactivate' : 'Deactivate' }}
          </button>
        </div>
      </article>
    </section>

    <!-- Map -->
    <section v-else-if="tab === 'map'" class="card">
      <p class="eyebrow">Interactive map</p>
      <h2 style="margin: 2px 0 6px">Routes and location markers</h2>
      <p class="meta">Active pickup points only. Tap a marker to see its name.</p>
      <ClientOnly>
        <BookingMapPicker :places="activeOnly" :pickup-id="null" :destination-id="null" @select="() => {}" />
        <template #fallback><p>Loading map...</p></template>
      </ClientOnly>
    </section>

    <!-- Fare rules -->
    <section v-else>
      <p class="lead">Fare = the larger of the starting fare, or starting fare + (distance in km &times; added per km). The range is added on top for the highest fare.</p>
      <p v-if="rulesBanner" role="alert" style="background: #fbeaea; color: #9b1c1c; padding: 12px">{{ rulesBanner }}</p>
      <p v-if="rulesMessage" role="status" style="background: #e6f2ea; padding: 12px">{{ rulesMessage }}</p>

      <form novalidate @submit.prevent="saveRules">
        <fieldset v-for="r in rules" :key="r.transport" style="margin: 0 0 12px; padding: 14px">
          <legend>{{ r.transport }}</legend>
          <div style="margin-bottom: 10px">
            <label :for="`base-${r.transport}`">Starting fare (&#8369;)</label>
            <input :id="`base-${r.transport}`" v-model.number="r.baseFare" type="number" class="search" />
          </div>
          <div style="margin-bottom: 10px">
            <label :for="`km-${r.transport}`">Added per km (&#8369;)</label>
            <input :id="`km-${r.transport}`" v-model.number="r.perKm" type="number" step="0.5" class="search" />
          </div>
          <div>
            <label :for="`range-${r.transport}`">Range (&#8369;)</label>
            <input :id="`range-${r.transport}`" v-model.number="r.range" type="number" class="search" />
          </div>
        </fieldset>
        <button type="submit" class="btn-primary btn-block">Save fare rules</button>
      </form>
    </section>
  </main>
</template>