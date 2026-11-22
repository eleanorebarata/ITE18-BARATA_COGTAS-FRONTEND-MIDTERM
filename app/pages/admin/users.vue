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
</script>

<template>
  <main class="page">
    <p class="eyebrow">Account management</p>
    <h1>Users and drivers</h1>
    <p class="lead">Accounts cannot be deleted. Deactivate them instead, so booking history stays intact.</p>

    <div class="card">
      <label for="q">Search</label>
      <input id="q" v-model="filters.q" type="search" class="search" placeholder="Name, email, or plate" />
      <div class="filters">
        <div>
          <label for="f-role">Role</label>
          <select id="f-role" v-model="filters.role" class="search">
            <option value="">All</option>
            <option value="passenger">Passengers</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div>
          <label for="f-status">Status</label>
          <select id="f-status" v-model="filters.status" class="search">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
        <div>
          <label for="f-plate">Plate</label>
          <select id="f-plate" v-model="filters.plate" class="search">
            <option value="">All</option>
            <option value="unverified">Not verified</option>
          </select>
        </div>
      </div>
    </div>

    <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px">{{ banner }}</p>
    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #9b1c1c">{{ loadError }}</p>
    <p v-else-if="!shown.length" class="empty">No users match these filters.</p>

    <template v-else>
      <p class="meta" role="status">{{ shown.length }} record{{ shown.length === 1 ? '' : 's' }}</p>

      <article v-for="u in shown" :key="u.id" class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px">
          <div>
            <strong>{{ u.name }}</strong><span v-if="u.id === auth.user?.id" class="meta"> (you)</span>
            <p class="meta">{{ u.email }}</p>
          </div>
          <span class="tag" :class="`st-${u.status}`" style="text-transform: capitalize">{{ u.status }}</span>
        </div>
        <p class="meta" style="text-transform: capitalize">{{ u.role }}</p>
        <p v-if="u.statusReason" class="meta">{{ u.statusReason }}</p>
        <div v-if="u.role === 'driver'" class="box">
          <span class="k">Plate</span>
          <span class="v">{{ u.plateNumber }} &middot; {{ u.plateVerified ? 'Verified' : 'Not verified' }}</span>
        </div>

        <div class="card-actions">
          <button v-if="u.role === 'driver'" type="button" @click="togglePlate(u)">
            {{ u.plateVerified ? 'Remove verification' : 'Verify plate' }}
          </button>
          <button v-if="u.status !== 'deactivated'" type="button" class="btn-danger" :disabled="u.id === auth.user?.id"
                  @click="openStatus(u, 'deactivate')">Deactivate</button>
          <button v-else type="button" @click="openStatus(u, 'reactivate')">Reactivate</button>
        </div>
      </article>
    </template>

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