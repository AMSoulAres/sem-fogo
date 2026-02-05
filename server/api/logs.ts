import { defineEventHandler, getQuery } from 'h3'
import { mockFactory } from '../utils/mockFactory'

export default defineEventHandler((event) => {
    const query = getQuery(event)
    const cameraId = query.cameraId as string

    // Default to last 24h (1440 mins) if not specified
    // In a real app we'd parse the range object
    const rangeVal = 1440

    if (cameraId) {
        return {
            logs: mockFactory.getLogsForCamera(cameraId, rangeVal)
        }
    }

    // If no specific camera, maybe return a few priority logs or empty?
    // For now, let's just return an empty list or throw, but to prevent errors let's return empty
    return {
        logs: []
    }
})
