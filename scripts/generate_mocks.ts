import fs from 'node:fs'
import path from 'node:path'

// Mock Data Types (simplified for generation)
interface MockCamera {
    id: string
    name: string
    location: string
    groups: string[]
    status: 'online' | 'offline'
    geoLocation: { latitude: number; longitude: number }
}

interface MockLogConfig {
    cameraId: string
    relativeMinutes: number // 0 means now, 10 means 10 mins ago
    fireProbability: number
    quadrantZoom: number
    imagesBase64: string[]
    geoLocation: {
        latitude: number
        longitude: number
    }
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

// Map locations to approximate coordinates
const COORDINATES: Record<string, { latitude: number; longitude: number }> = {
    'Brasília, DF': { latitude: -15.793889, longitude: -47.882778 },
    'Sobradinho, DF': { latitude: -15.654763, longitude: -47.792777 },
    'Planaltina, DF': { latitude: -15.619080, longitude: -47.653497 },
    'Lago Sul, DF': { latitude: -15.839818, longitude: -47.876798 },
    'Plano Piloto, DF': { latitude: -15.7801, longitude: -47.9292 },
    'Águas Claras, DF': { latitude: -15.841584, longitude: -48.026388 }
}

const generateData = () => {
    const cameras: MockCamera[] = CAMERA_NAMES.map((name, index) => {
        const locationName = LOCATIONS[index % LOCATIONS.length]
        return {
            id: `cam-${index + 1}`,
            name: name,
            location: locationName,
            groups: [
                GROUPS[index % GROUPS.length],
                index % 3 === 0 ? 'Favoritas' : ''
            ].filter(Boolean),
            status: index === 3 ? 'offline' : 'online',
            // Default cam coords
            geoLocation: COORDINATES[locationName] || { latitude: -15.793889, longitude: -47.882778 } 
        }
    })

    const logs: Record<string, MockLogConfig[]> = {}

    cameras.forEach(camera => {
        const numLogs = Math.floor(Math.random() * 10) + 2 // 2 to 12 logs
        const cameraLogs: MockLogConfig[] = []

        // Start from recent times
        let currentRelativeMinutes = Math.floor(Math.random() * 60) // Start within last hour

        for (let i = 0; i < numLogs; i++) {
            // Gap between logs (30 mins to 4 hours)
            const gap = Math.floor(Math.random() * 240) + 30
            currentRelativeMinutes += gap
            
            // Jitter location slightly around camera
            const latJitter = (Math.random() - 0.5) * 0.005
            const lngJitter = (Math.random() - 0.5) * 0.005

            cameraLogs.push({
                cameraId: camera.id,
                relativeMinutes: currentRelativeMinutes,
                fireProbability: Math.floor(Math.random() * 100),
                quadrantZoom: Math.floor(Math.random() * 4) + 1,
                imagesBase64: [],
                geoLocation: {
                    latitude: camera.geoLocation.latitude + latJitter,
                    longitude: camera.geoLocation.longitude + lngJitter
                }
            })
        }
        
        logs[camera.id] = cameraLogs
    })

    const db: MockDB = { cameras, logs }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2))
    console.log(`Mock data generated at ${OUTPUT_FILE}`)
}

generateData()
