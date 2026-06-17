import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerAuthHandlers() {
  ipcMain.handle(
    'auth:login',
    (_, username: string, password: string) => {
      const db = getDb()

      const user = db
        .prepare(
          `
          SELECT *
          FROM users
          WHERE username = ?
          `
        )
        .get(username)

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        }
      }

      if (user.password_hash !== password) {
        return {
          success: false,
          message: 'Invalid password'
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    }
  )
}