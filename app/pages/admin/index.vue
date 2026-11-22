<script setup lang="ts">
import { useAdminService } from '~/services/admin'

definePageMeta({ middleware: ['auth', 'role'], role: 'admin' })

const service = useAdminService()
const auth = useAuthStore()

const { data: summary, pending, error } = await useAsyncData('admin-summary', () => service.summary(), { server: false })
const { data: places } = await useAsyncData('admin-dash-places', () => service.places(), { server: false })

const statuses = ['Pending', 'Accepted', 'Declined', 'Completed', 'Cancelled'] as const
const counts = computed<Record<string, number>>(() => (summary.value?.bookings ?? {}) as Record<string, number>)
const total = computed(() => statuses.reduce((n, s) => n + (counts.value[s] ?? 0), 0))
const pct = (s: string) => (total.value ? Math.round(((counts.value[s] ?? 0) / total.value) * 100) : 0)
const first = computed(() => (auth.user?.name ?? '').split(' ')[0] || 'Admin')
</script>

<template>
  <main class="page">
    <p class="eyebrow">Live overview</p>
    <h1>Good day, {{ first }}</h1>
    <p class="lead">All counts update with this session's records.</p>

    <p v-if="pending">Loading...</p>
    <p v-else-if="error" role="alert" style="color: #9b1c1c">{{ toApiError(error).message }}</p>

    <template v-else-if="summary">
      <section class="card">
        <h2 style="margin-top: 0">Quick actions</h2>
        <NuxtLink to="/admin/transport" class="btn-primary btn-block">Add pickup point</NuxtLink>
        <NuxtLink to="/admin/transport?tab=fares" class="btn-outline btn-block" style="margin-top: 8px">Update fares</NuxtLink>
        <NuxtLink to="/admin/bookings" class="btn-outline btn-block" style="margin-top: 8px">Review bookings</NuxtLink>
      </section>

      <section v-if="summary.pendingPlates" class="card" style="background: #fdf3cc; border-color: #f2b705">
        <strong>{{ summary.pendingPlates }} plate{{ summary.pendingPlates === 1 ? '' : 's' }} to verify</strong>
        <p class="meta">Drivers cannot accept requests until their plate is verified.</p>
        <NuxtLink to="/admin/users?plate=unverified" class="btn-outline">Review them</NuxtLink>
      </section>

      <section class="card">
        <h2 style="margin-top: 0">Booking status summary</h2>
        <div v-for="s in statuses" :key="s" class="bar-row">
          <span>{{ s }}</span>
          <span class="bar-track"><span class="bar-fill" :style="{ width: pct(s) + '%' }" /></span>
         <b>{{ counts[s] ?? 0 }}</b>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 8px">Accounts</h2>
        <div class="stat-grid">
          <div class="stat"><b>{{ summary.activeUsers }}</b><span>Active</span></div>
          <div class="stat"><b>{{ summary.suspendedUsers }}</b><span>Suspended</span></div>
          <div class="stat"><b>{{ summary.deactivatedUsers }}</b><span>Deactivated</span></div>
        </div>
      </section>

      <section class="card flush" style="margin-top: 16px">
        <div class="pad"><h2 style="margin: 0">Pickup points</h2><p class="meta">{{ places?.length ?? 0 }} managed campus places</p></div>
        <NuxtLink v-for="p in (places ?? []).slice(0, 5)" :key="p.id" to="/admin/transport" class="row">
          <span class="grow">{{ p.name }}<span class="meta" style="display: block; font-weight: 400">{{ p.address ?? 'CSU Main Campus' }}</span></span>
          <span class="tag" :class="{ 'st-deactivated': p.active === false }">{{ p.active === false ? 'Deactivated' : 'Active' }}</span>
        </NuxtLink>
      </section>
    </template>
  </main>
</template>