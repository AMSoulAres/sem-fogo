<script setup lang="ts">
const { cameras, toggleGroup, groups } = useCameraData()

const search = ref('')
const filter = ref('all') // all, online, offline, or specific group name

const filteredCameras = computed(() => {
  return cameras.value.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(search.value.toLowerCase()) ||
      camera.location.toLowerCase().includes(search.value.toLowerCase())

    if (!matchesSearch) return false

    if (filter.value === 'all') return true
    if (filter.value === 'online') return camera.status === 'online'
    if (filter.value === 'offline') return camera.status === 'offline'

    // Check if filter is a group
    return camera.groups.includes(filter.value)
  })
})

const filterOptions = computed(() => [
  { label: 'Todas', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  ...groups.value.map(g => ({ label: g, value: g }))
])

const openDetails = (camera: any) => {
  // Optional: implement if cameras page also needs details
}
</script>

<template>
  <UDashboardPanel>
    <div class="p-4 overflow-y-auto flex-1">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <CameraCard v-for="camera in filteredCameras" :key="camera.id" :camera="camera" @toggle-group="toggleGroup"
          @open-details="openDetails" />
      </div>

      <div v-if="filteredCameras.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-500">
        <UIcon name="i-heroicons-video-camera-slash" class="w-12 h-12 mb-2" />
        <p>Nenhuma câmera encontrada.</p>
      </div>
    </div>
  </UDashboardPanel>
</template>
