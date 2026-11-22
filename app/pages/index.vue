<template>
  <main style="max-width: 420px">
    <h1 class="center">Welcome</h1>
    <p class="center" style="color: var(--color-muted)">
      Book a tricycle or bao-bao around the CSU Main Campus.
    </p>

    <div class="role-list">
      <NuxtLink to="/auth/user-login" class="role-card">
        <span class="ico"><AppIcon name="pin" /></span>
        <span><strong>Passenger</strong><small>Book and track a ride</small></span>
      </NuxtLink>
      <NuxtLink to="/auth/driver-login" class="role-card">
        <span class="ico"><AppIcon name="inbox" /></span>
        <span><strong>Driver</strong><small>Accept requests and share your location</small></span>
      </NuxtLink>
      <NuxtLink to="/auth/admin-login" class="role-card">
        <span class="ico"><AppIcon name="grid" /></span>
        <span><strong>Administrator</strong><small>Manage users, reports and fares</small></span>
      </NuxtLink>
    </div>

    <p class="center">
      <NuxtLink to="/routes">Routes and fares</NuxtLink>
      &middot;
      <NuxtLink to="/auth/user-register">Create account</NuxtLink>
    </p>
  </main>
</template>