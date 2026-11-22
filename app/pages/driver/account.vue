<script setup lang="ts">
import { useDriverService } from '~/services/driver'

definePageMeta({ middleware: ['auth', 'role'], role: 'driver' })

const auth = useAuthStore()
const service = useDriverService()
const { data: profile } = await useAsyncData('driver-profile', () => service.profile(), { server: false })

const initial = computed(() => (auth.user?.name ?? '?').charAt(0).toUpperCase())

async function logout() {
  auth.logout()
  await navigateTo('/auth/driver-login')
}
</script>

<template>
  <main class="page">
    <div class="card profile">
      <div class="big-avatar" aria-hidden="true">{{ initial }}</div>
      <span class="tag">{{ auth.status === 'suspended' ? 'Suspended' : 'Active' }}</span>
      <h1 style="margin: 8px 0 0; font-size: 1.4rem">{{ auth.user?.name }}</h1>
      <p class="meta" style="font-size: 0.85rem">Driver account</p>
      <template v-if="profile">
        <p class="meta">{{ profile.vehicleType }} &middot; Plate <strong>{{ profile.plateNumber }}</strong></p>
        <span class="tag" :style="profile.plateVerified ? '' : 'background: #fdf3cc; color: #5c4400'">
          {{ profile.plateVerified ? 'Plate verified' : 'Plate waiting for verification' }}
        </span>
      </template>
    </div>

    <div class="card flush">
      <NuxtLink to="/reports" class="row">
        <span class="ico-circle"><AppIcon name="flag" :size="20" /></span>
        <span class="grow">My reports<span class="meta" style="display: block; font-weight: 400">Reports you sent about passengers</span></span>
        <AppIcon name="chevron" :size="18" class="chev" />
      </NuxtLink>
      <NuxtLink to="/routes" class="row">
        <span class="ico-circle"><AppIcon name="tag" :size="20" /></span>
        <span class="grow">Routes and fares<span class="meta" style="display: block; font-weight: 400">See the fare rules</span></span>
        <AppIcon name="chevron" :size="18" class="chev" />
      </NuxtLink>
      <button type="button" class="row danger" @click="logout">
        <span class="ico-circle" style="background: #fbeaea; color: #9b1c1c"><AppIcon name="logout" :size="20" /></span>
        <span class="grow">Log out<span class="meta" style="display: block; font-weight: 400">End this session securely</span></span>
        <AppIcon name="chevron" :size="18" class="chev" />
      </button>
    </div>
  </main>
</template>