import { defineEventHandler } from 'h3'
import { formatISO, subHours, addMinutes } from 'date-fns'
import type { CameraInfoLogResponse } from '~/types'

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomFloat = (min: number, max: number, decimals: number = 1) => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals)
    return parseFloat(str)
}

export default defineEventHandler(async (event) => {
    // Generate mock logs for 6 cameras
    const logs: CameraInfoLogResponse[] = []
    const now = new Date()

    const imageUrls = [
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlD4JX82qIbuiwO0VPg7gXxz910EKwmMxYzg&s',
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1572402123736-c79526a911eb?q=80&w=800&auto=format&fit=crop'
    ]

    for (let i = 1; i <= 6; i++) {
        const id = `cam-${i}`

        // Generate logs for the last 24 hours with random intervals
        let currentTime = subHours(now, 24)

        while (currentTime <= now) {
            // Simulate variety in fire probability
            // 80% chance of being low (safe state)
            // 20% chance of being elevated (warning/danger state)
            let probability: number
            if (Math.random() > 0.8) {
                probability = getRandomInt(20, 100)
            } else {
                probability = getRandomInt(0, 15)
            }

            // Varied camera telemetry
            const angleH = getRandomInt(0, 180)
            const angleV = getRandomInt(-45, 45) // Limit vertical to reasonable range
            const zoom = getRandomFloat(1, 10, 1)

            logs.push({
                cameraId: id,
                timestamp: formatISO(currentTime),
                fireProbability: probability,
                angleHorizontal: angleH,
                angleVertical: angleV,
                zoom: zoom,
                imageBase64: imageUrls[i - 1] || '' // Using URLs as base64 placeholders for mock
            })

            // Increment time by reasonable random steps (e.g. 15 to 45 minutes)
            // to get a good distribution over 24h
            currentTime = addMinutes(currentTime, getRandomInt(15, 45))
        }
    }

    // Sort logs by timestamp just in case (though we generated in order, mixing cameras breaks global order)
    // Actually the frontend might expect sorted or not, but usually good practice.
    // However, for pure mock data generation simplicity, let's leave as is or basic sort.
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})
