import type { AvatarProps } from '@nuxt/ui'

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  startTimestamp: string
  endTimestamp: string
}

export interface Camera {
  id: string
  name: string
  location: string
  groups: string[] // List of group IDs this camera belongs to
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
  imagesBase64: string[]
}

export interface CameraInfo {
  id: string
  name: string
  location: string
  groups: string[] // List of group IDs this camera belongs to
  status: 'online' | 'offline'
}

export interface CameraLogsRequest {
  cameraId: string
  range: Range
  quadrantZoom: number
}

export interface Log {
  cameraId: string
  timestamp: string // ISO date string
  fireProbability: number // 0-100
  quadrantZoom: number
  imagesBase64: string[]
}

export interface CameraLogsResponse {
  logs: Log[]
}
