<template>
  <div class="auth-shell">
    <NuxtLink to="/" class="auth-brand">
      <span class="brand-mark" aria-hidden="true">C</span>
      <span>CSU Mobility</span>
    </NuxtLink>
    <div class="auth-card"><slot /></div>
  </div>
</template>