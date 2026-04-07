import fs from 'node:fs'
import path from 'node:path'

const DB_PATH = path.resolve(process.cwd(), 'server/data/db.json')

interface Preferences {
  groups: string[]
  camerasPerPage: number
}

function loadPrefs(userId: string): Preferences {
  try {
    if (fs.existsSync(DB_PATH)) {
      const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
      return db.preferences?.[userId] ?? { groups: ['Favoritas'], camerasPerPage: 2 }
    }
  }
  catch {}
  return { groups: ['Favoritas'], camerasPerPage: 2 }
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Não autenticado.' })
  }
  const userId = (session.user as any).id
  return loadPrefs(userId)
})
