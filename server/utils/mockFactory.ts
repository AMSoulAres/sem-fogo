import fs from 'node:fs'
import path from 'node:path'
import { subMinutes, formatISO } from 'date-fns'
import type { CameraInfo, Log } from '~/types'

// Define simplified types matching the JSON structure
interface MockLogConfig {
    cameraId: string
    relativeMinutes: number
    fireProbability: number
    quadrantZoom: number
    imagesBase64: string[]
}

interface MockDB {
    cameras: CameraInfo[]
    logs: Record<string, MockLogConfig[]>
}

const DB_PATH = path.resolve(process.cwd(), 'server/data/db.json')

let dbCache: MockDB | null = null

const loadDB = (): MockDB => {
    // In dev, we might want to reload this often, but for now we load once or check existence
    if (!dbCache) {
        try {
            if (fs.existsSync(DB_PATH)) {
                const data = fs.readFileSync(DB_PATH, 'utf-8')
                dbCache = JSON.parse(data)
            } else {
                console.error('Mock DB not found at', DB_PATH)
                return { cameras: [], logs: {} }
            }
        } catch (e) {
            console.error('Failed to load mock DB', e)
            return { cameras: [], logs: {} }
        }
    }
    return dbCache!
}

export const mockFactory = {
    // No longer need explicit state advancement if we rely on the file,
    // but if we want to simulate "change" we could use an offset here.
    // For now, consistent data as per "static file" requirement.
    advanceState: () => { },

    getCameras: (): CameraInfo[] => {
        const db = loadDB()
        return db.cameras
    },

    getLogsForCamera: (cameraId: string, rangeMinutes: number = 1440): Log[] => {
        const db = loadDB()
        const rawLogs = db.logs[cameraId] || []

        // Convert relative minutes to actual timestamps
        // Filter by range (relativeMinutes <= rangeMinutes)
        // relativeMinutes 0 = NOW, relativeMinutes 10 = 10 mins ago

        const now = new Date()

        return rawLogs
            .filter(l => l.relativeMinutes <= rangeMinutes && l.relativeMinutes >= 0)
            .map(l => {
                return {
                    cameraId: l.cameraId,
                    timestamp: formatISO(subMinutes(now, l.relativeMinutes)),
                    fireProbability: l.fireProbability,
                    quadrantZoom: l.quadrantZoom,
                    imagesBase64: l.imagesBase64
                }
            })
            // Ensure data is sorted descending (closest to now first)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
}
