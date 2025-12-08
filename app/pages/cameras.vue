<script setup lang="ts">
const { cameras, toggleFavorite } = useCameraData()

const search = ref('')
const filter = ref('all') // all, online, offline, favorites

const filteredCameras = computed(() => {
  return cameras.value.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(search.value.toLowerCase()) || 
                          camera.location.toLowerCase().includes(search.value.toLowerCase())
    
    if (!matchesSearch) return false

    if (filter.value === 'favorites') return camera.isFavorite
    if (filter.value === 'online') return camera.status === 'online'
    if (filter.value === 'offline') return camera.status === 'offline'
    
    return true
  })
})

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Favoritas', value: 'favorites' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' }
]
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Todas as Câmeras">
      <template #right>
        <UInput 
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar câmera..."
          class="w-64"
        />
        <USelectMenu 
          v-model="filter" 
          :options="filterOptions" 
          value-attribute="value"
          option-attribute="label"
          class="w-40"
        />
      </template>
    </UDashboardNavbar>

    <div class="p-4 overflow-y-auto flex-1">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <CameraCard 
          v-for="camera in filteredCameras" 
          :key="camera.id" 
          :camera="camera"
          @toggle-favorite="toggleFavorite"
        />
      </div>
      
      <div v-if="filteredCameras.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-500">
        <UIcon name="i-heroicons-video-camera-slash" class="w-12 h-12 mb-2" />
        <p>Nenhuma câmera encontrada.</p>
      </div>
    </div>
  </UDashboardPanel>
</template>
