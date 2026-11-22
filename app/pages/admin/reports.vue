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
  <main class="page">
    <p class="eyebrow">Safety</p>
    <h1>Reports</h1>

    <div class="card">
      <label for="r-status">Status</label>
      <select id="r-status" v-model="status" class="search">
        <option value="">All</option>
        <option>Open</option>
        <option>Under review</option>
        <option>Resolved</option>
        <option>Dismissed</option>
      </select>
    </div>

    <p v-if="banner" role="status" style="background: #e6f2ea; padding: 12px">{{ banner }}</p>
    <p v-if="loading">Loading...</p>
    <p v-else-if="loadError" role="alert" style="color: #9b1c1c">{{ loadError }}</p>
    <p v-else-if="!reports.length" class="empty">No reports with this status.</p>

    <article v-for="r in reports" v-else :key="r.id" class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
        <span class="tag">{{ r.status }}</span>
        <span class="meta">{{ when(r.createdAt) }}</span>
      </div>
      <h2 style="font-size: 1rem; margin: 8px 0 2px">{{ r.categoryLabel }}</h2>
      <p class="meta">
        From {{ r.reporterName }} ({{ r.reporterRole }}) about
        {{ r.targetType === 'review' ? `a review of ${r.targetName}` : `${r.targetName} (${r.targetType})` }}
      </p>
      <div class="box"><span class="v" style="font-weight: 400">{{ r.description }}</span></div>
      <p v-if="r.adminNote" class="meta">Admin note: {{ r.adminNote }}</p>

      <div class="card-actions">
        <button v-if="r.status === 'Open'" type="button" @click="underReview(r)">Mark under review</button>
        <template v-if="r.status === 'Open' || r.status === 'Under review'">
          <button type="button" class="btn-primary" @click="openDialog(r, 'Resolved')">Resolve</button>
          <button type="button" @click="openDialog(r, 'Dismissed')">Dismiss</button>
        </template>
        <button v-if="r.reviewId" type="button" @click="toggleHidden(r)">
          {{ r.reviewHidden ? 'Show review again' : 'Hide review' }}
        </button>
      </div>
    </article>

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