<script setup lang="ts">
import { startOfDay, endOfDay, eachMinuteOfInterval, format, isSameMinute, parseISO, getHours, getMinutes } from 'date-fns'
import type { PriorityLog } from '~/types'

const props = defineProps<{
  logs: PriorityLog[]
}>()

const emit = defineEmits(['select-time'])


const segments = computed(() => {
  const segs = []
  const now = new Date()

  const start = startOfDay(now)
  const end = endOfDay(now)

  // 15 min intervals
  const totalSegments = 24 * 4 // 96

  for (let i = 0; i < totalSegments; i++) {
    const segmentStart = new Date(start.getTime() + i * 15 * 60 * 1000)
    const segmentEnd = new Date(segmentStart.getTime() + 15 * 60 * 1000)

    const logsInSegment = props.logs.filter(log => {
      const logTime = parseISO(log.timestamp)
      return logTime >= segmentStart && logTime < segmentEnd
    })

    const maxProb = logsInSegment.reduce((max, log) => Math.max(max, log.probability), 0)

    let color = 'bg-emerald-500' // Green default
    if (maxProb > 80) color = 'bg-red-600'
    else if (maxProb > 50) color = 'bg-orange-500'
    else if (maxProb > 20) color = 'bg-yellow-400'

    segs.push({
      start: segmentStart,
      color,
      maxProb,
      label: format(segmentStart, 'HH:mm')
    })
  }

  return segs
})

</script>

<template>

  <div
    class="h-full w-6 flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 ml-4">
    <div class="text-xs text-center py-2 font-bold text-gray-500">24h</div>
    <div class="flex-1 flex flex-col w-full relative h-full">
      <div v-for="(segment, index) in segments" :key="index"
        class="w-full flex-1 cursor-pointer transition-colors hover:opacity-80 relative group min-h-[11px]"
        :class="segment.color" @click="$emit('select-time', segment.start)">
        <div
          class="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg font-mono">
          {{ segment.label }}
        </div>
      </div>
    </div>
  </div>

</template>
