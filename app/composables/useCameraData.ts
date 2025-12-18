import { sub, formatISO } from 'date-fns'
import type { Camera, PriorityLog } from '~/types'

export const useCameraData = () => {
    // Persistent Groups
    const groups = useLocalStorage<string[]>('camera-groups', ['Favoritas', 'Zona Norte', 'Zona Sul', 'Parques'])

    // Persistent Cameras
    const cameras = useLocalStorage<Camera[]>('cameras-v1', [
        {
            id: 'cam-1',
            name: 'Esplanada/Lago',
            location: 'Brasília, DF',
            groups: ['Favoritas', 'Zona Sul'],
            status: 'online',
            fireProbability: 10,
            imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlD4JX82qIbuiwO0VPg7gXxz910EKwmMxYzg&s'
        },
        {
            id: 'cam-2',
            name: 'Parque Nacional',
            location: 'Brasília, DF',
            groups: ['Favoritas', 'Zona Norte', 'Parques'],
            status: 'online',
            fireProbability: 85,
            imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-3',
            name: 'Fercal',
            location: 'Sobradinho, DF',
            groups: ['Zona Norte'],
            status: 'online',
            fireProbability: 5,
            imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-4',
            name: 'Núcleo Rural',
            location: 'Planaltina, DF',
            groups: [],
            status: 'offline',
            fireProbability: 0,
            imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-5',
            name: 'Jardim Botânico',
            location: 'Lago Sul, DF',
            groups: ['Parques'],
            status: 'online',
            fireProbability: 45,
            imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop'
        },
        {
            id: 'cam-6',
            name: 'Torre de TV',
            location: 'Plano Piloto, DF',
            groups: ['Favoritas'],
            status: 'online',
            fireProbability: 12,
            imageUrl: 'https://images.unsplash.com/photo-1572402123736-c79526a911eb?q=80&w=800&auto=format&fit=crop'
        }
    ])

    // Mock Logs (Not persisted for now as they are "realtime")
    const logs = useState<PriorityLog[]>('logs', () => {
        const _logs: PriorityLog[] = []
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        for (let i = 0; i < 20; i++) {
            const minutesToAdd = Math.floor(Math.random() * (24 * 60))
            const date = new Date(startOfToday.getTime() + minutesToAdd * 60 * 1000)

            _logs.push({
                id: `log-${i}`,
                timestamp: formatISO(date),
                probability: Math.floor(Math.random() * 100),
                cameraId: `cam-${Math.floor(Math.random() * 6) + 1}`,
                cameraName: 'Camera ' + (Math.floor(Math.random() * 6) + 1)
            })
        }

        // Add recent high prob
        const now = new Date()
        _logs.push({
            id: 'log-recent-high',
            timestamp: formatISO(sub(now, { minutes: 30 })),
            probability: 92,
            cameraId: 'cam-2',
            cameraName: 'Parque Nacional'
        })

        return _logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })

    const toggleGroup = (cameraId: string, groupName: string) => {
        const camera = cameras.value.find(c => c.id === cameraId)
        if (camera) {
            if (camera.groups.includes(groupName)) {
                camera.groups = camera.groups.filter(g => g !== groupName)
            } else {
                camera.groups.push(groupName)
            }
        }
    }

    const createGroup = (name: string) => {
        if (!groups.value.includes(name)) {
            groups.value.push(name)
        }
    }

    const sendCameraCommand = (cameraId: string, command: string) => {
        // Here we would call the API
        console.log(`Sending command ${command} to camera ${cameraId}`)
        return new Promise(resolve => setTimeout(resolve, 800))
    }

    return {
        cameras,
        logs,
        groups,
        toggleGroup,
        createGroup,
        sendCameraCommand
    }
}
