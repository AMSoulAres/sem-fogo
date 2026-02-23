<script setup lang="ts">
import { format } from 'date-fns'
import type { PriorityLog, Camera } from '~/types'

const { cameras, logs, groups, toggleGroup } = useCameraData()

const selectedGroup = useLocalStorage('selected-group', 'Favoritas')
const isLogsOpen = useLocalStorage('logs-open', false)
const isGroupManagerOpen = ref(false)

const search = ref('')

const currentPage = ref(0)
const itemsPerPage = 2

watch([selectedGroup, search], () => {
  currentPage.value = 0
})

const filteredCameras = computed(() => {
  let result = cameras.value

  if (selectedGroup.value !== 'Todas') {
    result = result.filter(c => c.groups.includes(selectedGroup.value))
  }

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

// Filter logs based on the currently filtered cameras (which respects search and group selection)
const filteredAllLogs = computed(() => {
  const cameraIds = new Set(filteredCameras.value.map(c => c.id))
  return logs.value.filter(log => cameraIds.has(log.cameraId))
})

const recentLogs = computed(() => filteredAllLogs.value.slice(0, 50)) // Increased to 50 for better context

const filteredLogs = computed(() => {
  if (!selectedTime.value) return recentLogs.value
  const start = new Date(selectedTime.value.getTime())
  // 15 min window as per timeline segments
  const end = new Date(selectedTime.value.getTime() + 15 * 60 * 1000) 
  
  return filteredAllLogs.value.filter(log => {
    const logTime = new Date(log.timestamp)
    return logTime >= start && logTime < end
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
const selectedCamera = ref<any | null>(null)
const isDetailsOpen = ref(false)

const openDetails = (camera: any) => {
  selectedCamera.value = camera
  isDetailsOpen.value = true
}

const selectedLog = ref<PriorityLog | null>(null)
const isLogModalOpen = ref(false)

const openLogDetails = (log: PriorityLog) => {
  selectedLog.value = log
  isLogModalOpen.value = true
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
          <UButton icon="i-heroicons-cog-6-tooth" color="neutral" variant="ghost" title="Gerenciar Grupos"
            @click="isGroupManagerOpen = true" />
          <UButton icon="i-heroicons-list-bullet" color="neutral" :variant="isLogsOpen ? 'solid' : 'ghost'"
            @click="isLogsOpen = !isLogsOpen" />
        </div>
      </template>
    </UDashboardNavbar>

    <div class="flex-1 flex overflow-hidden relative h-full bg-gray-50 dark:bg-gray-950">

      <!-- Timeline (Right Side) -->
      <Timeline :logs="filteredAllLogs" @select-time="handleTimeSelection" />

      <!-- Main Content: Cameras -->
      <div class="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-gray-950 overflow-hidden relative">

        <div class="flex-1 flex items-center justify-center relative">
          <UButton v-if="currentPage > 0" icon="i-heroicons-chevron-left"
            class="absolute left-0 z-10 rounded-full shadow-lg p-2" size="xl" color="neutral" variant="solid"
            @click="prevPage" />

          <!-- Camera Grid (Slides) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-h-[80vh]">
            <TransitionGroup name="fade">
              <div v-for="camera in displayedCameras" :key="camera.id" class="h-full flex flex-col">
                <CameraCard :camera="camera" class="h-full flex flex-col justify-between" @toggle-group="toggleGroup"
                  @open-details="openDetails" />
              </div>
            </TransitionGroup>

            <!-- If Empty -->
            <div v-if="displayedCameras.length === 0"
              class="col-span-3 flex flex-col items-center justify-center text-gray-400">
              <UIcon name="i-heroicons-video-camera-slash" class="w-16 h-16 mb-4" />
              <p class="text-xl">Nenhuma câmera encontrada.</p>
            </div>
          </div>

          <UButton v-if="currentPage < totalPages - 1" icon="i-heroicons-chevron-right"
            class="absolute right-0 z-10 rounded-full shadow-lg p-2" size="xl" color="neutral" variant="solid"
            @click="nextPage" />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center mt-4 gap-2">
          <div v-for="i in totalPages" :key="i" class="w-2 h-2 rounded-full transition-colors cursor-pointer"
            :class="(i - 1) === currentPage ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'"
            @click="currentPage = i - 1" />
        </div>
      </div>

      <!-- Logs Panel - Overlays from right side -->
      <Transition name="slide-left">
        <div v-if="isLogsOpen"
          class="absolute top-0 right-0 w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-xl z-30">
          <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <div class="flex flex-col">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ selectedTime ? 'Logs Detalhados' : 'Logs Recentes' }}
              </h3>
              <span v-if="selectedTime" class="text-xs text-gray-500">
                {{ format(selectedTime, 'dd/MM HH:mm') }} - {{ format(new Date(selectedTime.getTime() + 15 * 60000), 'HH:mm') }}
              </span>
            </div>
            <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" @click="isLogsOpen = false" />
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            <div v-if="filteredLogs.length === 0" class="text-center text-gray-500 py-4 text-sm">
              Nenhum log encontrado neste período.
            </div>
            <div v-for="log in filteredLogs" :key="log.id"
              class="p-3 rounded-lg cursor-pointer transition-all duration-200 group"
              :class="[
                log.probability >= 70
                  ? 'border border-red-500 bg-red-950/80 shadow-[0_0_12px_2px_rgba(239,68,68,0.45)] hover:shadow-[0_0_20px_4px_rgba(239,68,68,0.65)]'
                  : log.probability >= 31
                    ? 'border border-orange-500/60 bg-orange-950/40 shadow-sm hover:bg-orange-900/50'
                    : 'border border-gray-700 hover:bg-gray-800 shadow-sm'
              ]"
              @click="openLogDetails(log)">

              <div class="flex justify-between items-start mb-1 gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <UIcon
                    v-if="log.probability >= 70"
                    name="i-heroicons-fire"
                    class="w-5 h-5 text-red-400 shrink-0"
                  />
                  <UIcon
                    v-else-if="log.probability >= 31"
                    name="i-heroicons-exclamation-triangle"
                    class="w-5 h-5 text-orange-400 shrink-0"
                  />
                  <span
                    class="font-medium text-base line-clamp-1"
                    :class="log.probability >= 70 ? 'text-red-200 font-semibold' : log.probability >= 31 ? 'text-orange-200' : 'text-gray-100'"
                  >{{ log.cameraName }}</span>
                </div>
                <UBadge
                  :color="log.probability >= 70 ? 'error' : log.probability >= 31 ? 'warning' : 'success'"
                  :variant="'soft'"
                  size="lg"
                  :class="log.probability >= 70 ? 'font-bold tracking-wide' : ''"
                >
                  {{ log.probability }}%
                </UBadge>
              </div>

              <div
                class="flex items-center text-sm gap-2"
                :class="log.probability >= 70 ? 'text-red-300' : log.probability >= 31 ? 'text-orange-300' : 'text-gray-200'"
              >
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                {{ format(new Date(log.timestamp), 'HH:mm:ss') }}
              </div>
            </div>
          </div>
        </div>
      </Transition>

    </div>

    <!-- Modais -->
    <CameraDetailsModal v-if="selectedCamera" v-model="isDetailsOpen" :camera="selectedCamera" />
    <LogDetailsModal v-if="selectedLog" v-model="isLogModalOpen" :log="selectedLog" />
    <GroupManagerModal v-if="isGroupManagerOpen" @close="isGroupManagerOpen = false" />

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

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

</style>