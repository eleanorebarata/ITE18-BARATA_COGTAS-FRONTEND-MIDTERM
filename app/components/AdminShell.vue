<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()
const drawer = ref<HTMLDialogElement>()

const links = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { to: '/admin/users', label: 'Users and drivers', icon: 'users' },
  { to: '/admin/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/admin/reports', label: 'Reports', icon: 'flag' },
  { to: '/admin/cancellations', label: 'Cancellations', icon: 'ban' },
  { to: '/admin/transport', label: 'Transport management', icon: 'tag' }
]

const isActive = (l: { to: string; exact?: boolean }) =>
  l.exact ? route.path === l.to : route.path === l.to || route.path.startsWith(l.to + '/')

const title = computed(() => links.find(isActive)?.label ?? 'Administration')
const initials = computed(() =>
  (auth.user?.name ?? 'A').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('')
)

watch(() => route.path, () => drawer.value?.close())

function onBackdrop(e: MouseEvent) {
  if (e.target === drawer.value) drawer.value?.close()
}

async function logout() {
  drawer.value?.close()
  auth.logout()
  await navigateTo('/auth/admin-login')
}
</script>

<template>
  <div class="shell is-admin">
    <header class="adminbar">
      <button type="button" class="icon-btn" aria-label="Open menu" @click="drawer?.showModal()">
        <AppIcon name="menu" :size="24" />
      </button>
      <div class="adminbar-title"><small>Administration</small><strong>{{ title }}</strong></div>
      <span class="avatar-soft" aria-hidden="true">{{ initials }}</span>
    </header>

    <div class="content"><slot /></div>

    <dialog ref="drawer" class="drawer" aria-label="Admin menu" @click="onBackdrop">
      <div class="drawer-head">
        <BrandMark />
        <span class="brand-text"><strong>CSU Mobility</strong><small>Administration</small></span>
        <span style="flex: 1" />
        <button type="button" class="icon-btn" aria-label="Close menu" @click="drawer?.close()">
          <AppIcon name="close" :size="22" />
        </button>
      </div>
      <nav aria-label="Admin sections">
        <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="row" :class="{ 'is-active': isActive(l) }"
                  :aria-current="isActive(l) ? 'page' : undefined">
          <span class="ico-circle"><AppIcon :name="l.icon" :size="20" /></span>
          <span class="grow">{{ l.label }}</span>
        </NuxtLink>
        <button type="button" class="row danger" @click="logout">
          <span class="ico-circle" style="background: #fbeaea; color: #9b1c1c"><AppIcon name="logout" :size="20" /></span>
          <span class="grow">Log out</span>
        </button>
      </nav>
    </dialog>
  </div>
</template>