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
}

export interface CameraInfo {
  id: string
  name: string
  location: string
  groups: string[] // List of group IDs this camera belongs to
  status: 'online' | 'offline'
}

export interface CameraInfoRequest {
  cameraId: string
  timestamp: string // ISO date string
  angleHorizontal: number
  angleVertical: number
  zoom: number
}

export interface CameraInfoLogResponse {
  cameraId: string
  timestamp: string // ISO date string
  fireProbability: number // 0-100
  angleHorizontal: number
  angleVertical: number
  zoom: number
  imageBase64: string
}
