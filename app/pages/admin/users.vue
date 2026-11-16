<script setup lang="ts">
import type { AdminUser } from '~/types/api'
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const route = useRoute()
const service = useAdminService()
const auth = useAuthStore()

const users = ref<AdminUser[]>([])
const loading = ref(true)
const loadError = ref('')
const banner = ref('')
const filters = reactive({
  role: '',
  status: '',
  q: '',
  plate: route.query.plate === 'unverified' ? 'unverified' : ''
})

async function load() {
  loading.value = true
  try {
    const query = Object.fromEntries(
      Object.entries({ role: filters.role, status: filters.status, q: filters.q.trim() }).filter(([, v]) => v)
    )
    users.value = await service.users(query)
    loadError.value = ''
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => [filters.role, filters.status], load)
let timer: ReturnType<typeof setTimeout>
watch(() => filters.q, () => {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
})

const shown = computed(() =>
  filters.plate === 'unverified' ? users.value.filter(u => u.role === 'driver' && !u.plateVerified) : users.value
)

// ----- deactivate / reactivate dialog -----
const dialog = ref<any>(null)
const target = ref<AdminUser | null>(null)
const mode = ref<'deactivate' | 'reactivate'>('deactivate')
const dialogError = ref('')
const dialogBusy = ref(false)

const dialogReasons = computed(() => (mode.value === 'deactivate' ? deactivateReasons : reactivateReasons))
const dialogTitle = computed(() =>
  `${mode.value === 'deactivate' ? 'Deactivate' : 'Reactivate'} ${target.value?.name ?? ''}?`
)
const dialogIntro = computed(() =>
  mode.value === 'deactivate'
    ? 'This user will not be able to log in. Their booking history is kept, and you can reactivate the account later.'
    : 'This user will be able to log in again.'
)

function openStatus(u: AdminUser, m: 'deactivate' | 'reactivate') {
  target.value = u
  mode.value = m
  dialogError.value = ''
  dialog.value?.open()
}

async function confirmStatus(p: { reasonCode: string; note: string }) {
  if (!target.value) return
  dialogBusy.value = true
  dialogError.value = ''
  try {
    const updated = await service.setStatus(target.value.id, {
      status: mode.value === 'deactivate' ? 'deactivated' : 'active',
      reasonCode: p.reasonCode,
      note: p.note
    })
    dialog.value?.close()
    banner.value = `${updated.name} is now ${updated.status}.`
    await load()
  } catch (e) {
    dialogError.value = toApiError(e).message
  } finally {
    dialogBusy.value = false
  }
}

async function togglePlate(u: AdminUser) {
  banner.value = ''
  try {
    const updated = await service.verifyPlate(u.id, !u.plateVerified)
    banner.value = `${updated.name}'s plate is now ${updated.plateVerified ? 'verified' : 'not verified'}.`
    await load()
  } catch (e) {
    banner.value = toApiError(e).message
  }
}

const statusColor: Record<string, string> = { active: '#14522c', suspended: '#8a6d00', deactivated: '#8a1c1c' }
</script>

<template>
  <main style="max-width: 1000px; margin: 0 auto; padding: 16px">
    <AdminNav />
    <h1>Users and drivers</h1>
    <p>Accounts cannot be deleted. Deactivate them instead, so their booking history stays intact.</p>

    <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px">
      <label>Role
        <select v-model="filters.role" style="display: block; min-height: 44px">
          <option value="">All</option>
          <option value="passenger">Passengers</option>
          <option value="driver">Drivers</option>
          <option value="admin">Administrators</option>
        </select>
      </label>
      <label>Status
        <select v-model="filters.status" style="display: block; min-height: 44px">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </label>
      <label>Plate
        <select v-model="filters.plate" style="display: block; min-height: 44px">
          <option value="">All</option>
          <option value="unverified">Not verified</option>
        </select>
      </label>
      <label>Search
        <input v-model="filters.q" type="search" placeholder="Name, email, or plate" style="display: block; min-height: 44px" />
      </label>
    </div>

    <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px; border-radius: 8px">{{ banner }}</p>
    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #8a1c1c">{{ loadError }}</p>
    <p v-else-if="!shown.length">No users match these filters.</p>

    <div v-else style="overflow-x: auto">
      <table style="width: 100%; border-collapse: collapse; min-width: 720px">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid #d1d5db">
            <th scope="col" style="padding: 8px">Name</th>
            <th scope="col" style="padding: 8px">Role</th>
            <th scope="col" style="padding: 8px">Status</th>
            <th scope="col" style="padding: 8px">Plate</th>
            <th scope="col" style="padding: 8px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in shown" :key="u.id" style="border-bottom: 1px solid #e5e7eb">
            <td style="padding: 8px">
              {{ u.name }}<span v-if="u.id === auth.user?.id"> (you)</span><br />
              <small>{{ u.email }}</small>
            </td>
            <td style="padding: 8px">{{ u.role }}</td>
            <td style="padding: 8px">
              <strong :style="{ color: statusColor[u.status] }">{{ u.status }}</strong>
              <br /><small v-if="u.statusReason">{{ u.statusReason }}</small>
            </td>
            <td style="padding: 8px">
              <template v-if="u.role === 'driver'">
                {{ u.plateNumber }}<br />
                <small>{{ u.plateVerified ? 'Verified' : 'Not verified' }}</small>
              </template>
              <template v-else>-</template>
            </td>
            <td style="padding: 8px">
              <div style="display: flex; flex-wrap: wrap; gap: 8px">
                <button v-if="u.role === 'driver'" style="min-height: 44px" @click="togglePlate(u)">
                  {{ u.plateVerified ? 'Remove verification' : 'Verify plate' }}
                </button>
                <button v-if="u.status !== 'deactivated'" :disabled="u.id === auth.user?.id"
                        style="min-height: 44px; background: #fff; color: #8a1c1c; border: 2px solid #8a1c1c; border-radius: 8px"
                        @click="openStatus(u, 'deactivate')">
                  Deactivate
                </button>
                <button v-else style="min-height: 44px" @click="openStatus(u, 'reactivate')">Reactivate</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReasonDialog
      ref="dialog"
      :title="dialogTitle"
      :intro="dialogIntro"
      :reasons="dialogReasons"
      :confirm-label="mode === 'deactivate' ? 'Deactivate account' : 'Reactivate account'"
      :tone="mode === 'deactivate' ? 'danger' : 'primary'"
      :busy="dialogBusy"
      :error="dialogError"
      @confirm="confirmStatus"
    />
  </main>
</template>