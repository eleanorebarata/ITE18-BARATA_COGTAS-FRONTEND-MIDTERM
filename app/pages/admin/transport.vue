<script setup lang="ts">
import type { FareRule, Place } from '~/types/api'
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const service = useAdminService()
const { data: places, refresh: refreshPlaces, pending } = await useAsyncData('admin-places', () => service.places(), { server: false })
const { data: rulesData, refresh: refreshRules } = await useAsyncData('admin-rules', () => service.fareRules(), { server: false })

const rules = ref<FareRule[]>([])
watch(rulesData, (v) => { if (v) rules.value = v.map(r => ({ ...r })) }, { immediate: true })

const editingId = ref<string | null>(null)
const form = reactive({ name: '', lat: '', lng: '' })
const errors = reactive<Record<string, string>>({})
const banner = ref('')
const message = ref('')
const rulesBanner = ref('')
const rulesMessage = ref('')

function resetForm() {
  editingId.value = null
  form.name = ''
  form.lat = ''
  form.lng = ''
}

function startEdit(p: Place) {
  editingId.value = p.id
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
  <main style="max-width: 900px; margin: 0 auto; padding: 16px">
    <AdminNav />
    <h1>Routes and fares</h1>

    <h2>Pickup points</h2>
    <p v-if="banner" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">{{ banner }}</p>
    <p v-if="message" role="status" style="background: #e6f2ea; padding: 12px; border-radius: 8px">{{ message }}</p>

    <p v-if="pending">Loading...</p>
    <table v-else style="width: 100%; border-collapse: collapse">
      <thead><tr><th align="left">Name</th><th align="left">Latitude</th><th align="left">Longitude</th><th align="left">Status</th><th /></tr></thead>
      <tbody>
        <tr v-for="p in places ?? []" :key="p.id">
          <td>{{ p.name }}</td>
          <td>{{ p.lat }}</td>
          <td>{{ p.lng }}</td>
          <td>{{ p.active === false ? 'Deactivated' : 'Active' }}</td>
          <td>
            <button type="button" style="min-height: 44px" @click="startEdit(p)">Edit</button>
            <button type="button" style="min-height: 44px; margin-left: 8px" @click="toggle(p)">
              {{ p.active === false ? 'Reactivate' : 'Deactivate' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <h3>{{ editingId ? 'Edit pickup point' : 'Add pickup point' }}</h3>
    <form novalidate style="display: grid; gap: 12px; max-width: 400px" @submit.prevent="submitPlace">
      <div>
        <label for="pname">Name</label>
        <input id="pname" v-model="form.name" :aria-invalid="!!errors.name" style="display: block; width: 100%; min-height: 44px" />
        <small v-if="errors.name" style="color: #8a1c1c">{{ errors.name }}</small>
      </div>
      <div>
        <label for="plat">Latitude (example: 8.9552)</label>
        <input id="plat" v-model="form.lat" inputmode="decimal" :aria-invalid="!!errors.lat" style="display: block; width: 100%; min-height: 44px" />
        <small v-if="errors.lat" style="color: #8a1c1c">{{ errors.lat }}</small>
      </div>
      <div>
        <label for="plng">Longitude (example: 125.5975)</label>
        <input id="plng" v-model="form.lng" inputmode="decimal" :aria-invalid="!!errors.lng" style="display: block; width: 100%; min-height: 44px" />
        <small v-if="errors.lng" style="color: #8a1c1c">{{ errors.lng }}</small>
      </div>
      <div>
        <button type="submit" style="min-height: 44px; padding: 0 20px">{{ editingId ? 'Save changes' : 'Add' }}</button>
        <button v-if="editingId" type="button" style="min-height: 44px; margin-left: 8px" @click="resetForm">Cancel</button>
      </div>
    </form>

    <h2>Fare rules</h2>
    <p>Fare = the larger of the starting fare, or starting fare + (distance in km × added per km). The range is added on top for the highest fare.</p>
    <p v-if="rulesBanner" role="alert" style="background: #f8e6e6; color: #8a1c1c; padding: 12px; border-radius: 8px">{{ rulesBanner }}</p>
    <p v-if="rulesMessage" role="status" style="background: #e6f2ea; padding: 12px; border-radius: 8px">{{ rulesMessage }}</p>

    <form novalidate @submit.prevent="saveRules">
      <fieldset v-for="r in rules" :key="r.transport" style="margin-bottom: 12px; border: 1px solid #d1d5db; border-radius: 12px">
        <legend>{{ r.transport }}</legend>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px">
          <div>
            <label :for="`base-${r.transport}`">Starting fare (₱)</label>
            <input :id="`base-${r.transport}`" v-model.number="r.baseFare" type="number" style="display: block; width: 100%; min-height: 44px" />
          </div>
          <div>
            <label :for="`km-${r.transport}`">Added per km (₱)</label>
            <input :id="`km-${r.transport}`" v-model.number="r.perKm" type="number" step="0.5" style="display: block; width: 100%; min-height: 44px" />
          </div>
          <div>
            <label :for="`range-${r.transport}`">Range (₱)</label>
            <input :id="`range-${r.transport}`" v-model.number="r.range" type="number" style="display: block; width: 100%; min-height: 44px" />
          </div>
        </div>
      </fieldset>
      <button type="submit" style="min-height: 44px; padding: 0 20px">Save fare rules</button>
    </form>
  </main>
</template>