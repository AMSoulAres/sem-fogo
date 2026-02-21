<script setup lang="ts">
import type { PriorityLog } from '~/types';

interface Props {
    log: PriorityLog
}

const props = defineProps<Props>()
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- Image Display in 16:9 Aspect Ratio Container -->
    <div class="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex justify-center items-center shadow-lg ring-1 ring-gray-200 dark:ring-gray-800">
      <UCarousel
        v-if="log.imagesBase64?.length > 0"
        v-slot="{ item }"
        arrows
        dots
        :watch-drag="false"
        :items="log.imagesBase64"
        :ui="{
          root: 'w-full h-full relative',
          viewport: 'w-full h-full overflow-hidden',
          container: 'w-full h-full flex',
          item: 'min-w-0 basis-full flex justify-center items-center',
          controls: 'absolute inset-0 pointer-events-none z-20',
          arrows: 'absolute inset-x-16 top-1/2 flex justify-between',
          prev: 'pointer-events-auto bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all w-8 h-8',
          next: 'pointer-events-auto bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all w-8 h-8',
          dots: 'absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto',
          dot: 'w-2.5 h-2.5 rounded-full transition-colors bg-white/40 data-[state=active]:bg-white shadow-sm'
        }"
        class="w-full h-full"
      >
        <div class="relative w-full h-full flex items-center justify-center bg-transparent">
          <img :src="item" class="w-full h-full object-contain">
        </div>
      </UCarousel>
      
      <!-- Fallback when there are no images -->
      <div v-else class="text-white text-opacity-50 flex flex-col items-center justify-center p-12">
        <UIcon name="i-heroicons-photo" class="w-16 h-16 mb-4 opacity-50" />
        <span class="text-lg">Sem imagem disponível</span>
      </div>
    </div>

    <!-- Information placed below the image to maximize view clarity -->
    <div class="flex items-center justify-between px-1 shrink-0">
      <div>
        <div class="text-xs opacity-75 font-medium mb-0.5">ID da Câmera</div>
        <div class="font-mono text-sm font-semibold tracking-tight">{{ log.cameraId }}</div>
      </div>
      <div>
        <UBadge :color="log.probability > 70 ? 'error' : log.probability > 30 ? 'warning' : 'success'" size="lg">
          {{ log.probability }}% Probabilidade
        </UBadge>
      </div>
    </div>
  </div>
</template>