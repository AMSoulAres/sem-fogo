<script setup lang="ts">
import { format } from 'date-fns'
import type { PriorityLog, Camera } from '~/types'

const { cameras, logs, groups, toggleGroup } = useCameraData()

// UI Persistence
const selectedGroup = useLocalStorage('selected-group', 'Favoritas')
const isLogsOpen = useLocalStorage('logs-open', false)

// Search
const search = ref('')

// Pagination
const currentPage = ref(0)
const itemsPerPage = 2

// Watch group or search change to reset page
watch([selectedGroup, search], () => {
  currentPage.value = 0
})

const filteredCameras = computed(() => {
  let result = cameras.value

  // Filter by Group
  if (selectedGroup.value !== 'Todas') {
    result = result.filter(c => c.groups.includes(selectedGroup.value))
  }

  // Filter by Search
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter(c => c.name.toLowerCase().includes(s) || c.location.toLowerCase().includes(s))
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredCameras.value.length / itemsPerPage))

const displayedCameras = computed(() => {
  const start = currentPage.value * itemsPerPage
  return filteredCameras.value.slice(start, start + itemsPerPage)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 0) currentPage.value--
}

// Logs Logic
const selectedTime = ref<Date | null>(null)
const recentLogs = computed(() => logs.value.slice(0, 20))
const filteredLogs = computed(() => {
  if (!selectedTime.value) return recentLogs.value
  const start = new Date(selectedTime.value.getTime() - 30 * 60 * 1000)
  const end = new Date(selectedTime.value.getTime() + 30 * 60 * 1000)
  return logs.value.filter(log => {
    const logTime = new Date(log.timestamp)
    return logTime >= start && logTime <= end
  })
})

const handleTimeSelection = (time: Date) => {
  selectedTime.value = time
  isLogsOpen.value = true
}

const clearSelection = () => {
  selectedTime.value = null
}

// Camera Details
const selectedCamera = ref<Camera | null>(null)
const isDetailsOpen = ref(false)

const openDetails = (camera: Camera) => {
  selectedCamera.value = camera
  isDetailsOpen.value = true
}

const openLogDetails = (log: PriorityLog) => {
  const cam = cameras.value.find(c => c.id === log.cameraId)
  if (cam) openDetails(cam)
}

</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Monitoramento de Fogo">
      <template #right>
        <div class="flex items-center gap-2">
          <!-- Search -->
          <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Buscar..." class="w-48" />
          <USelectMenu v-model="selectedGroup" :items="['Todas', ...groups]" class="w-48">
          </USelectMenu>
          <UButton icon="i-heroicons-list-bullet" color="neutral" :variant="isLogsOpen ? 'solid' : 'ghost'"
            @click="isLogsOpen = !isLogsOpen" />
        </div>
      </template>
    </UDashboardNavbar>

    <div class="flex-1 flex overflow-hidden relative">
      <!-- Main Content: Cameras -->
      <div class="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-gray-950 overflow-hidden relative">

        <div class="flex-1 flex items-center justify-center relative">
          <!-- Left Arrow -->
          <UButton v-if="currentPage > 0" icon="i-heroicons-chevron-left"
            class="absolute left-0 z-10 rounded-full shadow-lg p-2" size="xl" color="neutral" variant="solid"
            @click="prevPage" />

          <!-- Camera Grid (Slide) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-h-[80vh]">
            <TransitionGroup name="fade">
              <div v-for="camera in displayedCameras" :key="camera.id" class="h-full flex flex-col">
                <CameraCard :camera="camera" class="h-full flex flex-col justify-between" @toggle-group="toggleGroup"
                  @open-details="openDetails" />
              </div>
            </TransitionGroup>

            <!-- Empty State -->
            <div v-if="displayedCameras.length === 0"
              class="col-span-3 flex flex-col items-center justify-center text-gray-400">
              <UIcon name="i-heroicons-video-camera-slash" class="w-16 h-16 mb-4" />
              <p class="text-xl">Nenhuma câmera encontrada.</p>
            </div>
          </div>

          <!-- Right Arrow -->
          <UButton v-if="currentPage < totalPages - 1" icon="i-heroicons-chevron-right"
            class="absolute right-0 z-10 rounded-full shadow-lg p-2" size="xl" color="neutral" variant="solid"
            @click="nextPage" />
        </div>

        <!-- Pagination Indicators -->
        <div v-if="totalPages > 1" class="flex justify-center mt-4 gap-2">
          <div v-for="i in totalPages" :key="i" class="w-2 h-2 rounded-full transition-colors cursor-pointer"
            :class="(i - 1) === currentPage ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'"
            @click="currentPage = i - 1" />
        </div>
      </div>

      <!-- Timeline (Right Side) -->
      <Timeline :logs="logs" @select-time="handleTimeSelection" />

      <!-- Logs Panel -->
      <div v-if="isLogsOpen"
        class="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col transition-all">
        <div class="p-3 border-b flex items-center justify-between">
          <h3 class="font-semibold">{{ selectedTime ? 'Logs no Momento' : 'Logs Recentes' }}</h3>
          <UButton v-if="selectedTime" icon="i-heroicons-arrow-path" size="xs" variant="ghost"
            @click="clearSelection" />
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <div v-for="log in filteredLogs" :key="log.id"
            class="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            @click="openLogDetails(log)">
            <div class="flex justify-between text-xs text-gray-500">
              {{ format(new Date(log.timestamp), 'HH:mm') }}
              <span :class="log.probability > 50 ? 'text-red-500' : 'text-green-500'">{{ log.probability }}%</span>
            </div>
            <div class="font-medium text-sm">{{ log.cameraName }}</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modals -->
    <CameraDetailsModal v-if="selectedCamera" v-model="isDetailsOpen" :camera="selectedCamera" />

  </UDashboardPanel>
</template>

<style scoped>
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.fade-leave-active {
  position: absolute;
}
</style>