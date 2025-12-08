import { sub, add, formatISO } from 'date-fns'
import type { Camera, PriorityLog } from '~/types'

export const useCameraData = () => {
    // Mock
    const cameras = useState<Camera[]>('cameras', () => [
        {
            id: 'cam-1',
            name: 'Esplanada/Lago',
            location: 'Brasília, DF',
            isFavorite: true,
            status: 'online',
            fireProbability: 10,
            imageUrl: 'https://images.unsplash.com/photo-1596326232938-795641770963?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-2',
            name: 'Parque Nacional',
            location: 'Brasília, DF',
            isFavorite: true,
            status: 'online',
            fireProbability: 85,
            imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-3',
            name: 'Fercal',
            location: 'Sobradinho, DF',
            isFavorite: false,
            status: 'online',
            fireProbability: 5,
            imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-4',
            name: 'Núcleo Rural',
            location: 'Planaltina, DF',
            isFavorite: false,
            status: 'offline',
            fireProbability: 0,
            imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-5',
            name: 'Jardim Botânico',
            location: 'Lago Sul, DF',
            isFavorite: true,
            status: 'online',
            fireProbability: 45,
            imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop'
        }
    ])

    // Mock
    const logs = useState<PriorityLog[]>('logs', () => {
        const now = new Date()
        const _logs: PriorityLog[] = []

        // Generate logs for "Today" so they show up in the timeline
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        for (let i = 0; i < 20; i++) {
            // Random time today
            const minutesToAdd = Math.floor(Math.random() * (24 * 60))
            const date = new Date(startOfToday.getTime() + minutesToAdd * 60 * 1000)

            _logs.push({
                id: `log-${i}`,
                timestamp: formatISO(date),
                probability: Math.floor(Math.random() * 100),
                cameraId: `cam-${Math.floor(Math.random() * 5) + 1}`,
                cameraName: 'Camera ' + (Math.floor(Math.random() * 5) + 1)
            })
        }

        // Add a high probability log recently
        _logs.push({
            id: 'log-recent-high',
            timestamp: formatISO(sub(now, { minutes: 30 })),
            probability: 92,
            cameraId: 'cam-2',
            cameraName: 'Parque Nacional'
        })

        return _logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })

    const toggleFavorite = (cameraId: string) => {
        const camera = cameras.value.find(c => c.id === cameraId)
        if (camera) {
            camera.isFavorite = !camera.isFavorite
        }
    }

    return {
        cameras,
        logs,
        toggleFavorite
    }
}
