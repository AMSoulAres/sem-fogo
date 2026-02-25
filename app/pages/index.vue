<script setup lang="ts">
import { format } from 'date-fns'
import type { PriorityLog, Camera } from '~/types'

const logsProbabilityLabel = {
  critical: {
    min: 50,
    max: 70
  },
  warning: {
    min: 70,
    max: 100
  }
}

const { cameras, logs, groups, camerasPerPage, updateCamerasPerPage, toggleGroup } = useCameraData()
const { user, clear: clearSession } = useUserSession()

const selectedGroup = useLocalStorage('selected-group', 'Favoritas')
const isLogsOpen = useLocalStorage('logs-open', false)
const isGroupManagerOpen = ref(false)
const logPrioritySelected = ref('Sem filtro');

const search = ref('')
const currentPage = ref(0)

const handleLogout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clearSession()
  await navigateTo('/login')
}

const userMenuItems = computed(() => [
  [{ label: (user.value as any)?.name ?? (user.value as any)?.username ?? 'Usuário', disabled: true }],
  [{ label: 'Câmeras por página', disabled: true }],
  [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map(n => ({
    label: String(n) + (camerasPerPage.value === n ? ' ✓' : ''),
    click: () => { updateCamerasPerPage(n); currentPage.value = 0 },
    onSelect: () => { updateCamerasPerPage(n); currentPage.value = 0 }
  })),
  [{ label: 'Sair', icon: 'i-heroicons-arrow-right-on-rectangle', color: 'error' as const, click: handleLogout }]
])

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

const totalPages = computed(() => Math.ceil(filteredCameras.value.length / camerasPerPage.value))

const displayedCameras = computed(() => {
  const start = currentPage.value * camerasPerPage.value
  return filteredCameras.value.slice(start, start + camerasPerPage.value)
})
const gridRows = computed(() => {
  const n = displayedCameras.value.length
  const cols = gridCols.value
  return Math.ceil(n / cols)
})
const rowsClassMap: Record<number, string> = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
}
// Compute grid cols based on item count
const gridCols = computed(() => {
  const n = displayedCameras.value.length
  if (n <= 1) return 1
  if (n <= 2) return 2
  if (n <= 4) return 2
  if (n <= 6) return 3
  if (n <= 9) return 3
  return 4
})

// Static map so Tailwind can scan all classes at build time
const colsClassMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}


const gridColsClass = computed(() =>
  colsClassMap[gridCols.value] ?? 'grid-cols-2'
)

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

const filteredTimeLogs = computed(() => {
  if (!selectedTime.value) return recentLogs.value
  const start = new Date(selectedTime.value.getTime())
  // 15 min window as per timeline segments
  const end = new Date(selectedTime.value.getTime() + 15 * 60 * 1000) 
  
  return filteredAllLogs.value.filter(log => {
    const logTime = new Date(log.timestamp)
    return logTime >= start && logTime < end
  })
})

const logPriorityFiltered = computed(() => {
  return filteredTimeLogs.value.filter(log => {
    if (logPrioritySelected.value == 'Sem filtro') return true
    if (logPrioritySelected.value == 'Moderado') return log.probability >= logsProbabilityLabel.critical.min && log.probability < logsProbabilityLabel.critical.max
    if (logPrioritySelected.value == 'Crítico') return log.probability >= logsProbabilityLabel.warning.min
    return false
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
const openDetails = (camera: any) => {
  navigateTo(`/camera/${camera.id}`)
}

const openLogDetails = (log: PriorityLog) => {
  navigateTo(`/log/${log.id}`)
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
          <!-- Menu -->
          <UDropdownMenu :items="userMenuItems">
            <UButton icon="i-heroicons-user-circle" color="neutral" variant="ghost" />
          </UDropdownMenu>
        </div>
      </template>
    </UDashboardNavbar>

    <div class="flex-1 flex overflow-hidden relative h-full bg-gray-50 dark:bg-gray-950">

      <!-- Timeline -->
      <Timeline :logs="filteredAllLogs" @select-time="handleTimeSelection" />

      <!-- Cameras -->
      <div class="flex-1 flex flex-col p-4 bg-gray-50 dark:bg-gray-950 overflow-hidden relative">

        <div class="flex-1 flex items-start justify-center relative min-h-0 overflow-y-auto py-2">
          <UButton v-if="currentPage > 0" icon="i-heroicons-chevron-left"
            class="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg p-2" size="xl" color="neutral" variant="solid"
            @click="prevPage" />

          <!-- Camera Grid -->
          <div
            class="grid gap-3 w-full px-1 py-1"
            :class="gridColsClass"
          >
            <TransitionGroup name="fade">
              <div v-for="camera in displayedCameras" :key="camera.id">
                <CameraCard
                  :camera="camera"
                  :compact="gridCols >= 4"
                  @toggle-group="toggleGroup"
                  @open-details="openDetails"
                />
              </div>
            </TransitionGroup>

            <div v-if="displayedCameras.length === 0"
              class="col-span-4 flex flex-col items-center justify-center text-gray-400 py-16">
              <UIcon name="i-heroicons-video-camera-slash" class="w-16 h-16 mb-4" />
              <p class="text-xl">Nenhuma câmera encontrada.</p>
            </div>
          </div>

          <UButton v-if="currentPage < totalPages - 1" icon="i-heroicons-chevron-right"
            class="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg p-2" size="xl" color="neutral" variant="solid"
            @click="nextPage" />
        </div>

        <div v-if="totalPages > 1" class="flex justify-center mt-4 gap-2">
          <div v-for="i in totalPages" :key="i" class="w-2 h-2 rounded-full transition-colors cursor-pointer"
            :class="(i - 1) === currentPage ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'"
            @click="currentPage = i - 1" />
        </div>
      </div>

      <!-- Logs -->
      <Transition name="slide-left">
        <div v-if="isLogsOpen"
          class="absolute top-0 right-0 w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-xl z-30">
          <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <div class="flex flex-col">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                {{ selectedTime ? 'Logs do Período' : 'Logs Recentes' }}
              </h3>
              <div class="flex flex-col items-start gap-2 mb-1">
                <USelectMenu v-model="logPrioritySelected" class="w-48"
                :items="['Sem filtro', 'Moderado', 'Crítico']"></USelectMenu>
                <div class="text-xs text-gray-300 ml-2">Filtro por nível de risco</div>
              </div>
              <span v-if="selectedTime" class="text-xs text-gray-500">
                {{ format(selectedTime, 'dd/MM HH:mm') }} - {{ format(new Date(selectedTime.getTime() + 15 * 60000), 'HH:mm') }}
              </span>
            </div>
            <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" @click="isLogsOpen = false" />
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            <div v-if="logPriorityFiltered.length === 0" class="text-center text-gray-500 py-4 text-sm">
              Nenhum log encontrado neste período.
            </div>
            <div v-for="log in logPriorityFiltered" :key="log.id"
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