import { defineEventHandler } from 'h3'
import { mockFactory } from '../utils/mockFactory'

export default defineEventHandler((event) => {
    // Advance state to simulate change over time if desired, or keep it per request
    // For "varying with the call", we can increment here
    mockFactory.advanceState()

    return mockFactory.getCameras()
})
