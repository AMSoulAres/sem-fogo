import fs from 'node:fs'
import path from 'node:path'

const DB_PATH = path.resolve(process.cwd(), 'server/data/db.json')

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)
    if (!session?.user) {
        throw createError({ statusCode: 401, message: 'Não autenticado.' })
    }

    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
    const userId = (session.user as any).id
    const prefs = db.preferences?.[userId] ?? {
        groups: ['Favoritas', 'Zona Norte', 'Zona Sul', 'Parques'],
        camerasPerPage: 2
    }

    return prefs
})
