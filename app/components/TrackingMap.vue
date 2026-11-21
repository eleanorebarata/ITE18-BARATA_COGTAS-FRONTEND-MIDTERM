<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '~/types/api'

const props = defineProps<{ pickup: LatLng; driver: LatLng | null }>()

const el = ref<HTMLElement>()
let map: any
let L: any
let driverMarker: any
let fitted = false
let hadDriver = false

function sync() {
  if (!map) return

  if (props.driver) {
    const at = [props.driver.lat, props.driver.lng]
    if (!driverMarker) {
      driverMarker = L.circleMarker(at, { radius: 11, weight: 3, color: '#8a1c1c', fillColor: '#8a1c1c', fillOpacity: 0.8 })
        .addTo(map)
        .bindTooltip('Driver')
    } else {
      driverMarker.setLatLng(at)
    }
  } else if (driverMarker) {
    driverMarker.remove()
    driverMarker = null
  }

  // Fit the view the first time and when the driver appears. After that the passenger can pan freely.
  const has = !!props.driver
  if (!fitted || has !== hadDriver) {
    const points: number[][] = [[props.pickup.lat, props.pickup.lng]]
    if (props.driver) points.push([props.driver.lat, props.driver.lng])
    if (points.length === 1) map.setView(points[0], 16)
    else map.fitBounds(points, { padding: [40, 40] })
    fitted = true
    hadDriver = has
  }
}

onMounted(async () => {
  const mod: any = await import('leaflet')
  L = mod.default ?? mod

  map = L.map(el.value!)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  L.circleMarker([props.pickup.lat, props.pickup.lng], { radius: 11, weight: 3, color: '#1b6b3a', fillColor: '#1b6b3a', fillOpacity: 0.8 })
    .addTo(map)
    .bindTooltip('Pickup point')

  sync()
})

watch(() => [props.driver?.lat, props.driver?.lng], sync)
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="el" style="height: 300px; border-radius: 12px" role="application" aria-label="Map showing your pickup point and your driver" />
</template>