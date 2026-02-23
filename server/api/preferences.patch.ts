import fs from 'node:fs'
import path from 'node:path'

const DB_PATH = path.resolve(process.cwd(), 'server/data/db.json')

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)
    if (!session?.user) {
        throw createError({ statusCode: 401, message: 'Não autenticado.' })
    }

    const body = await readBody<{ groups?: string[]; camerasPerPage?: number }>(event)
    const userId = (session.user as any).id

    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))

    if (!db.preferences) db.preferences = {}
    const current = db.preferences[userId] ?? {}

    db.preferences[userId] = {
        ...current,
        ...(body.groups !== undefined ? { groups: body.groups } : {}),
        ...(body.camerasPerPage !== undefined ? { camerasPerPage: body.camerasPerPage } : {})
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))

    return db.preferences[userId]
})
