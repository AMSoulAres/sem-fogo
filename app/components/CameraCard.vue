<script setup lang="ts">
import type { Camera } from '~/types'

const props = defineProps<{
  camera: Camera
}>()

const emit = defineEmits(['toggle-favorite'])

const statusColor = computed(() => {
  return props.camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
})

const probabilityColor = computed(() => {
  if (props.camera.fireProbability > 70) return 'text-red-600'
  if (props.camera.fireProbability > 50) return 'text-orange-500'
  return 'text-green-600'
})
</script>

<template>
  <UCard :ui="{ body: { padding: 'p-0' }, header: { padding: 'p-3' }, footer: { padding: 'p-3' } }">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :class="statusColor" />
          <h3 class="font-semibold text-sm truncate">{{ camera.name }}</h3>
        </div>
        <UButton :icon="camera.isFavorite ? 'i-heroicons-star-20-solid' : 'i-heroicons-star'" color="primary"
          variant="ghost" size="xs" @click="$emit('toggle-favorite', camera.id)" />
      </div>
    </template>

    <div class="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden group">
      <img :src="camera.imageUrl" :alt="camera.name"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div v-if="camera.fireProbability > 0"
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-end justify-between">
        <div class="flex flex-col">
          <span class="text-[10px] text-gray-300 uppercase font-bold tracking-wider">Fire Probability</span>
          <span class="text-lg font-bold" :class="probabilityColor">
            {{ camera.fireProbability }}%
          </span>
        </div>

        <div v-if="camera.fireProbability > 50" class="animate-pulse">
          <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="text-red-500 w-6 h-6" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <UIcon name="i-heroicons-map-pin" class="w-3 h-3" />
          <span>{{ camera.location }}</span>
        </div>
        <UButton size="xs" color="neutral" variant="ghost" trailing-icon="i-heroicons-arrow-right-20-solid">
          Details
        </UButton>
      </div>
    </template>
  </UCard>
</template>
