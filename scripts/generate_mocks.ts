import fs from 'node:fs'
import path from 'node:path'

// Mock Data Types (simplified for generation)
interface MockCamera {
    id: string
    name: string
    location: string
    groups: string[]
    status: 'online' | 'offline'
}

interface MockLogConfig {
    cameraId: string
    relativeMinutes: number // 0 means now, 10 means 10 mins ago
    fireProbability: number
    quadrantZoom: number
    imagesBase64: string[]
}

interface MockDB {
    cameras: MockCamera[]
    logs: Record<string, MockLogConfig[]> // key is camera ID
}

const OUTPUT_DIR = path.resolve('server/data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'db.json')

// Constants
const LOCATIONS = [
    'Brasília, DF', 'Sobradinho, DF', 'Planaltina, DF',
    'Lago Sul, DF', 'Plano Piloto, DF', 'Águas Claras, DF'
]
const GROUPS = ['Favoritas', 'Zona Norte', 'Zona Sul', 'Parques', 'Residencial']
const CAMERA_NAMES = [
    'Esplanada/Lago', 'Parque Nacional', 'Fercal', 'Núcleo Rural',
    'Jardim Botânico', 'Torre de TV', 'Parque da Cidade',
    'Eixão Norte', 'Eixo Monumental'
]
const IMAGE_URLS = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlD4JX82qIbuiwO0VPg7gXxz910EKwmMxYzg&s',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1572402123736-c79526a911eb?q=80&w=800&auto=format&fit=crop'
]

// Determine deterministic seeded random
const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

const getSeededInt = (seed: number, min: number, max: number) => {
    return Math.floor(pseudoRandom(seed) * (max - min + 1)) + min
}

const getSeededItem = <T>(seed: number, arr: T[]): T => {
    return arr[getSeededInt(seed, 0, arr.length - 1)]
}

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const generateData = () => {
    const cameras: MockCamera[] = CAMERA_NAMES.map((name, index) => ({
        id: `cam-${index + 1}`,
        name: name,
        location: LOCATIONS[index % LOCATIONS.length],
        groups: [
            GROUPS[index % GROUPS.length],
            index % 3 === 0 ? 'Favoritas' : ''
        ].filter(Boolean),
        status: index === 3 ? 'offline' : 'online' // Fixed status for predictability
    }))

    const logs: Record<string, MockLogConfig[]> = {}

    cameras.forEach((cam, camIndex) => {
        const camLogs: MockLogConfig[] = []
        // Generate 24 hours of data (1440 minutes), every 10 minutes
        // Plus some extra buffer
        const interval = 10
        const duration = 1440 * 2 // 48h

        for (let m = 0; m <= duration; m += interval) {
            const seed = camIndex * 100000 + m

            // Cyclic Probability Wave
            // We want some cameras to have high probability periods
            // Use sin wave shifted by camera index
            const wave = Math.sin((m / 200) + camIndex)
            let prob = Math.floor(Math.abs(wave) * 20) // Base noise 0-20

            // Add spikes
            if (wave > 0.8 && getSeededInt(seed, 0, 10) > 7) {
                prob += getSeededInt(seed, 30, 70)
            }
            if (prob > 100) prob = 100

            camLogs.push({
                cameraId: cam.id,
                relativeMinutes: m, // Storing positive offset: 0 = now, 10 = 10 mins ago
                fireProbability: prob,
                quadrantZoom: getSeededInt(seed, 1, 4),
                imagesBase64: [getSeededItem(seed, IMAGE_URLS)]
            })
        }
        logs[cam.id] = camLogs
    })

    const db: MockDB = { cameras, logs }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2))
    console.log(`Mock data generated at ${OUTPUT_FILE}`)
}

generateData()
