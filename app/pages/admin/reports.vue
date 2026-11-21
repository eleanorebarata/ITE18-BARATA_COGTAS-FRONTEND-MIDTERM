<script setup lang="ts">
import type { AdminReport } from '~/types/api'
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const service = useAdminService()
const reports = ref<AdminReport[]>([])
const loading = ref(true)
const loadError = ref('')
const banner = ref('')
const status = ref('Open')

async function load() {
  loading.value = true
  try {
    reports.value = await service.reports(status.value ? { status: status.value } : {})
    loadError.value = ''
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(status, load)

const dialog = ref<any>(null)
const target = ref<AdminReport | null>(null)
const mode = ref<'Resolved' | 'Dismissed'>('Resolved')
const dialogError = ref('')
const dialogBusy = ref(false)
const reasons = computed(() => (mode.value === 'Resolved' ? resolveReasons : dismissReasons))

function openDialog(r: AdminReport, m: 'Resolved' | 'Dismissed') {
  target.value = r
  mode.value = m
  dialogError.value = ''
  dialog.value?.open()
}

async function confirm(p: { reasonCode: string; note: string }) {
  if (!target.value) return
  dialogBusy.value = true
  dialogError.value = ''
  try {
    await service.updateReport(target.value.id, { status: mode.value, reasonCode: p.reasonCode, note: p.note })
    dialog.value?.close()
    banner.value = `Report marked as ${mode.value.toLowerCase()}.`
    await load()
  } catch (e) {
    dialogError.value = toApiError(e).message
  } finally {
    dialogBusy.value = false
  }
}

async function underReview(r: AdminReport) {
  banner.value = ''
  try {
    await service.updateReport(r.id, { status: 'Under review' })
    banner.value = 'Report marked as under review.'
    await load()
  } catch (e) {
    banner.value = toApiError(e).message
  }
}

async function toggleHidden(r: AdminReport) {
  if (!r.reviewId) return
  banner.value = ''
  try {
    await service.hideReview(r.reviewId, !r.reviewHidden)
    banner.value = r.reviewHidden ? 'Review is visible again.' : 'Review hidden from passengers.'
    await load()
  } catch (e) {
    banner.value = toApiError(e).message
  }
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <main style="max-width: 900px; margin: 0 auto; padding: 16px">
    <AdminNav />
    <h1>Reports</h1>

    <label>Status
      <select v-model="status" style="display: block; min-height: 44px; margin-bottom: 16px">
        <option value="">All</option>
        <option>Open</option>
        <option>Under review</option>
        <option>Resolved</option>
        <option>Dismissed</option>
      </select>
    </label>

    <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px; border-radius: 8px">{{ banner }}</p>
    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #8a1c1c">{{ loadError }}</p>
    <p v-else-if="!reports.length">No reports with this status.</p>

    <ul v-else style="list-style: none; padding: 0">
      <li v-for="r in reports" :key="r.id" style="border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 12px">
        <strong>{{ r.status }}</strong> &middot; {{ r.categoryLabel }}
        <p style="margin: 8px 0 0">
          <small>
            From {{ r.reporterName }} ({{ r.reporterRole }}) about
            {{ r.targetType === 'review' ? `a review of ${r.targetName}` : `${r.targetName} (${r.targetType})` }}
            &middot; {{ when(r.createdAt) }}
          </small>
        </p>
        <p style="margin: 8px 0">{{ r.description }}</p>
        <p v-if="r.adminNote" style="margin: 0 0 8px"><small>Admin note: {{ r.adminNote }}</small></p>

        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <button v-if="r.status === 'Open'" style="min-height: 44px" @click="underReview(r)">Mark under review</button>
          <template v-if="r.status === 'Open' || r.status === 'Under review'">
            <button style="min-height: 44px; background: #1b6b3a; color: #fff; border: 0; border-radius: 8px; padding: 0 16px" @click="openDialog(r, 'Resolved')">Resolve</button>
            <button style="min-height: 44px" @click="openDialog(r, 'Dismissed')">Dismiss</button>
          </template>
          <button v-if="r.reviewId" style="min-height: 44px" @click="toggleHidden(r)">
            {{ r.reviewHidden ? 'Show review again' : 'Hide review' }}
          </button>
          <NuxtLink to="/admin/users" style="line-height: 44px">Open users and drivers</NuxtLink>
        </div>
      </li>
    </ul>

    <ReasonDialog
      ref="dialog"
      :title="mode === 'Resolved' ? 'Resolve this report' : 'Dismiss this report'"
      intro="Your reason is saved with the report."
      :reasons="reasons"
      :confirm-label="mode === 'Resolved' ? 'Resolve report' : 'Dismiss report'"
      :tone="mode === 'Resolved' ? 'primary' : 'danger'"
      :busy="dialogBusy"
      :error="dialogError"
      @confirm="confirm"
    />
  </main>
</template>