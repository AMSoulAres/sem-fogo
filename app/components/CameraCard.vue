<script setup lang="ts">
import type { Camera } from '~/types'

const props = defineProps<{
  camera: any
  compact?: boolean
}>()

const emit = defineEmits(['toggle-group', 'open-details'])

const { groups, createGroup, activeStreams } = useCameraData()

const isOnline = computed(() => props.camera.status === 'online')
const activeStreamsForCamera = computed(() => {
  return activeStreams.value.filter(s => s.cameraId === props.camera.id)
})
const prob = computed(() => props.camera.fireProbability ?? 0)

// Risk tier
const riskTier = computed(() => {
  if (prob.value > 70) return 'critical'
  if (prob.value > 50) return 'high'
  if (prob.value > 20) return 'medium'
  return 'safe'
})

const riskLabel = computed(() => ({
  critical: 'CRÍTICO',
  high: 'ALTO',
  medium: 'MÉDIO',
  safe: 'BAIXO',
}[riskTier.value]))

// Header background + border classes following the same risk grouping
const headerColorClasses = computed(() => {
  if (riskTier.value === 'critical') {
    return 'border-b border-red-700/60 bg-red-50 dark:bg-red-900/80'
  }
  if (riskTier.value === 'high' || riskTier.value === 'medium') {
    return 'border-b border-orange-500/20 dark:border-orange-600/30 bg-orange-50 dark:bg-orange-900/12'
  }
  return 'border-b border-gray-200 dark:border-gray-700'
})

const headerClass = computed(() => {
  const padding = props.compact ? 'p-1.5 sm:p-1.5' : 'p-3 sm:p-3'
  return `${padding} ${headerColorClasses.value}`
})

// Card border glow class
const cardBorderClass = computed(() => ({
  critical: 'outline outline-2 outline-red-600 shadow-[0_0_18px_4px_rgba(220,38,38,0.5)]',
  high:     'outline outline-2 outline-orange-500 shadow-[0_0_12px_2px_rgba(249,115,22,0.3)]',
  medium:   'outline outline-1 outline-yellow-400/60',
  safe:     '',
}[riskTier.value]))

// Probability text colour
const probabilityColor = computed(() => ({
  critical: 'text-red-500',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  safe:     'text-emerald-400',
}[riskTier.value]))

// Badge chip colour
const riskBadgeClass = computed(() => ({
  critical: 'bg-red-600/90 text-white',
  high:     'bg-orange-500/90 text-white',
  medium:   'bg-yellow-500/90 text-black',
  safe:     'bg-emerald-600/80 text-white',
}[riskTier.value]))

// Overlay gradient intensity
const overlayGradient = computed(() => ({
  critical: 'from-black/95 via-red-950/60 to-transparent',
  high:     'from-black/90 via-orange-950/40 to-transparent',
  medium:   'from-black/80 to-transparent',
  safe:     'from-black/70 to-transparent',
}[riskTier.value]))

const newGroup = ref('')

const addNewGroup = () => {
  if (!newGroup.value) return
  createGroup(newGroup.value)
  emit('toggle-group', props.camera.id, newGroup.value)
  newGroup.value = ''
}
</script>

<template>
  <div
    class="rounded-lg transition-all duration-300"
    :class="cardBorderClass"
  >
    <div class="rounded-lg overflow-hidden">
  <UCard
    :ui="{ body: 'p-0 sm:p-0', header: headerClass }"
    class=""
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden min-w-0">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="isOnline ? 'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)]' : 'bg-red-500'"
          />
          <h3 class="font-semibold truncate text-gray-900 dark:text-white" :class="compact ? 'text-xs' : 'text-sm'">
            {{ camera.name }}
          </h3>
        </div>

        <!-- Group bookmark -->
        <div class="flex items-center gap-1 shrink-0">
          <UPopover>
            <UButton
              icon="i-heroicons-bookmark"
              :color="camera.groups.length > 0 ? 'primary' : 'neutral'"
              variant="ghost"
              size="xs"
            />
            <template #content>
              <div class="p-3 w-64 space-y-3">
                <h4 class="font-medium text-xs text-gray-500 uppercase">Grupos da Câmera</h4>
                <div class="space-y-1 max-h-48 overflow-y-auto">
                  <div
                    v-for="group in groups"
                    :key="group"
                    class="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                  >
                    <UCheckbox
                      :model-value="camera.groups.includes(group)"
                      @update:model-value="$emit('toggle-group', camera.id, group)"
                    />
                    <span class="text-sm truncate flex-1">{{ group }}</span>
                  </div>
                </div>
                <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-1">
                  <UInput
                    v-model="newGroup"
                    placeholder="Novo grupo..."
                    size="xs"
                    class="flex-1"
                    @keyup.enter="addNewGroup"
                  />
                  <UButton
                    icon="i-heroicons-plus"
                    size="xs"
                    color="neutral"
                    variant="solid"
                    :disabled="!newGroup"
                    @click="addNewGroup"
                  />
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
    </template>

    <!-- ── Image + overlay ───────────────────────────────── -->
    <div
      class="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden group cursor-pointer"
      @click="$emit('open-details', camera)"
    >
      <img
        :src="camera.imageUrl"
        :alt="camera.name"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      <!-- Zoom Badge -->
      <div v-if="activeStreamsForCamera.length > 0" class="absolute top-2 right-2 flex gap-1 z-10">
        <UBadge color="error" variant="solid" size="xs" class="animate-pulse shadow-lg flex gap-1 items-center font-bold">
          <span class="relative flex h-2 w-2 mr-0.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          ZOOM ATIVO
        </UBadge>
      </div>

      <!-- Expand icon on hover -->
      <div
        class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <UIcon name="i-heroicons-arrows-pointing-out" class="text-white w-10 h-10 drop-shadow-lg" />
      </div>

      <!-- Fire probability overlay -->
      <div
        v-if="prob > 0"
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t p-3 flex items-end justify-between"
        :class="overlayGradient"
      >
        <!-- Left: label + value -->
        <div class="flex flex-col">
          <span class="text-gray-300 uppercase font-bold tracking-wider leading-none mb-0.5" :class="compact ? 'text-[8px]' : 'text-[10px]'">
            Probabilidade de Fogo
          </span>
          <div class="flex items-baseline gap-1">
            <span class="font-extrabold leading-none" :class="[probabilityColor, compact ? 'text-base' : 'text-2xl']">
              {{ prob }}%
            </span>
            <!-- Risk badge -->
            <span
              class="font-bold rounded uppercase tracking-wider leading-none"
              :class="[riskBadgeClass, compact ? 'text-[7px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5']"
            >
              {{ riskLabel }}
            </span>
          </div>
        </div>

        <!-- Right: alert icons -->
        <div class="flex flex-col items-center gap-1">
          <!-- Critical: double pulse -->
          <template v-if="riskTier === 'critical'">
            <div class="relative flex items-center justify-center">
              <span :class="compact ? 'h-5 w-5' : 'h-8 w-8'" class="absolute inline-flex rounded-full bg-red-500 opacity-60 animate-ping" />
              <UIcon name="i-heroicons-fire-solid" :class="compact ? 'w-4 h-4' : 'w-7 h-7'" class="relative text-red-400 drop-shadow-md" />
            </div>
            <span v-if="!compact" class="text-[9px] text-red-400 font-bold uppercase tracking-widest animate-pulse">
              Alerta!
            </span>
          </template>

          <!-- High: single pulse warning -->
          <template v-else-if="riskTier === 'high'">
            <div class="animate-pulse">
              <UIcon name="i-heroicons-exclamation-triangle-20-solid" :class="compact ? 'w-4 h-4' : 'w-6 h-6'" class="text-orange-400" />
            </div>
          </template>

          <!-- Medium: static warning -->
          <template v-else-if="riskTier === 'medium'">
            <UIcon name="i-heroicons-exclamation-triangle-20-solid" :class="compact ? 'w-3 h-3' : 'w-5 h-5'" class="text-yellow-400" />
          </template>
        </div>
      </div>
    </div>
  </UCard>
  </div>
  </div>
</template>
