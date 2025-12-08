import type { AvatarProps } from '@nuxt/ui'

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface Camera {
  id: string
  name: string
  location: string
  isFavorite: boolean
  status: 'online' | 'offline'
  fireProbability: number // 0-100
  imageUrl: string
}

export interface PriorityLog {
  id: string
  timestamp: string // ISO date string
  probability: number // 0-100
  cameraId: string
  cameraName: string
}
