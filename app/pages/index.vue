<script setup lang="ts">
import { format, isSameDay } from 'date-fns'
import type { PriorityLog } from '~/types'

const { cameras, logs, toggleFavorite } = useCameraData()

const viewMode = ref<'favorites' | 'all'>('favorites')
const search = ref('')
const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Favoritas', value: 'favorites' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' }
]
const filter = ref(filterOptions[0])

const selectedTime = ref<Date | null>(null)
const isLogsOpen = ref(false)

const displayedCameras = computed(() => {
  let result = cameras.value

  if (viewMode.value === 'favorites') {
    result = result.filter(c => c.isFavorite)
  } else {
    if (search.value) {
      const s = search.value.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(s) || c.location.toLowerCase().includes(s))
    }
    if (filter.value.value === 'online') result = result.filter(c => c.status === 'online')
    if (filter.value.value === 'offline') result = result.filter(c => c.status === 'offline')
    if (filter.value.value === 'favorites') result = result.filter(c => c.isFavorite)
  }

  return result
})

const recentLogs = computed(() => logs.value.slice(0, 10))

const filteredLogs = computed(() => {
  if (!selectedTime.value) return recentLogs.value

  // Show logs around the selected time (+- 30 mins)
  const start = new Date(selectedTime.value.getTime() - 30 * 60 * 1000)
  const end = new Date(selectedTime.value.getTime() + 30 * 60 * 1000)

  return logs.value.filter(log => {
    const logTime = new Date(log.timestamp)
    return logTime >= start && logTime <= end
  })
})

// Actions
const handleTimeSelection = (time: Date) => {
  selectedTime.value = time
  // Auto-open logs when a specific time is selected
  isLogsOpen.value = true
}

const clearSelection = () => {
  selectedTime.value = null
  // Optional: close logs or keep open? User might want to see "recent" logs. 
  // keeping it open or letting user close it is better.
}

const toggleLogs = () => {
  isLogsOpen.value = !isLogsOpen.value
}


</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Monitoramento de Fogo" :ui="{ right: 'gap-3' }">
      <template #right>
        <div class="flex items-center gap-2">
          <UButton v-if="viewMode === 'all'" icon="i-heroicons-star" label="Ver Favoritas" color="neutral"
            variant="ghost" @click="viewMode = 'favorites'" />
          <UButton v-else icon="i-heroicons-video-camera" label="Todas as Câmeras" color="neutral" variant="ghost"
            @click="viewMode = 'all'" />
        </div>

        <UButton icon="i-heroicons-list-bullet" color="neutral" variant="ghost" @click="toggleLogs"
          :variant="isLogsOpen ? 'solid' : 'ghost'">
        </UButton>
      </template>
    </UDashboardNavbar>

    <UDashboardToolbar>
      <template #left>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ viewMode === 'favorites' ? 'Câmeras Favoritas' : 'Todas as Câmeras' }}
        </h2>
      </template>

      <template #right>
        <div v-if="viewMode === 'all'" class="flex items-center gap-2">
          <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Buscar..." class="w-48" />
          <USelectMenu v-model="filter" :options="filterOptions" option-attribute="label" class="w-32">
            <template #label>
              {{ filter.label }}
            </template>
          </USelectMenu>
        </div>
      </template>
    </UDashboardToolbar>

    <div class="flex-1 p-4 overflow-hidden">
      <div class="h-full flex gap-4 transition-all duration-300">
        <!-- Left: Timeline (Always Visible) -->
        <Timeline :logs="logs" @select-time="handleTimeSelection" />

        <!-- Center: Camera Grid -->
        <div class="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">{{ displayedCameras.length }} câmeras listadas</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            <CameraCard v-for="camera in displayedCameras" :key="camera.id" :camera="camera"
              @toggle-favorite="toggleFavorite" />
          </div>

          <div v-if="displayedCameras.length === 0"
            class="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
            <UIcon name="i-heroicons-video-camera-slash" class="w-12 h-12 mb-2" />
            <p>Nenhuma câmera encontrada.</p>
          </div>
        </div>

        <!-- Right: Collapsible Logs Sidebar -->
        <div
          class="flex-none flex flex-col gap-4 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out"
          :class="[isLogsOpen ? 'w-80 pl-4 opacity-100' : 'w-0 pl-0 opacity-0']">
          <div class="flex items-center justify-between sticky top-0 py-2 z-10 w-80">
            <h3 class="text-base font-medium text-gray-700 dark:text-gray-200 truncate">
              {{ selectedTime ? 'Logs no Momento' : 'Logs Recentes' }}
            </h3>
            <div class="flex items-center gap-1">
              <UButton v-if="selectedTime" icon="i-heroicons-arrow-path" size="xs" color="gray" variant="ghost"
                title="Resetar tempo" @click="clearSelection" />
              <UButton icon="i-heroicons-x-mark" size="xs" color="gray" variant="ghost" @click="isLogsOpen = false" />
            </div>
          </div>

          <div class="space-y-3 w-80 overflow-y-auto pb-4">
            <div v-for="log in filteredLogs" :key="log.id"
              class="p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
              <div class="flex items-start justify-between mb-1">
                <span class="text-xs font-mono text-gray-500">
                  {{ format(new Date(log.timestamp), 'HH:mm:ss') }}
                </span>
                <UBadge :color="log.probability > 80 ? 'error' : log.probability > 50 ? 'warning' : 'success'"
                  variant="subtle" size="xs">
                  {{ log.probability }}%
                </UBadge>
              </div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ log.cameraName }}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Probabilidade de fogo detectada.
              </div>
            </div>

            <div v-if="filteredLogs.length === 0" class="text-center py-8 text-gray-500 text-sm">
              Nenhum log encontrado.
            </div>
          </div>
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>