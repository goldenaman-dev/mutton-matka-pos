import { ipcMain, BrowserWindow } from 'electron'
import { getDb } from '../database'

export function registerMenuHandlers() {

  ipcMain.handle('menu:getItems', () => {
    const db = getDb()

    const rows = db
      .prepare('SELECT * FROM items ORDER BY name')
      .all()

    console.log('ITEMS FOUND:', rows.length)

    return rows.map((item: any) => ({
      ...item,
      item_data: JSON.parse(item.item_data)
    }))
  })

  ipcMain.handle('menu:saveItem', (_, item) => {
    const db = getDb()

    db.prepare(`
      INSERT INTO items
      (name, item_data)
      VALUES (?, ?)
    `).run(
      item.name,
      JSON.stringify(item)
    )

    return { success: true }
  })

  ipcMain.handle('menu:updateItem', (_, item) => {
    const db = getDb()

    db.prepare(`
      UPDATE items
      SET
        name = ?,
        item_data = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      item.name,
      JSON.stringify(item),
      item.id
    )

    return { success: true }
  })

  ipcMain.handle('menu:import', (_, menuJson) => {
    try {
      const db = getDb()

      let items: any[] = []

      if (Array.isArray(menuJson)) {
        items = menuJson
      } else if (Array.isArray(menuJson.items)) {
        items = menuJson.items
      } else if (Array.isArray(menuJson.menu)) {
        for (const category of menuJson.menu) {
          for (const item of category.items) {
            items.push({
              ...item,
              category: category.category
            })
          }
        }
      } else {
        return {
          success: false,
          message: 'Unsupported JSON format'
        }
      }

      const insert = db.prepare(`
        INSERT INTO items
        (name, item_data)
        VALUES (?, ?)
      `)

      const update = db.prepare(`
        UPDATE items
        SET
          item_data = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)

      let importedCount = 0

      for (const item of items) {
        const existing = db
          .prepare(
            'SELECT id FROM items WHERE name = ?'
          )
          .get(item.name) as
          | { id: number }
          | undefined

        if (existing) {
          update.run(
            JSON.stringify(item),
            existing.id
          )
        } else {
          insert.run(
            item.name,
            JSON.stringify(item)
          )
        }

        importedCount++
      }

      const count = db
        .prepare(
          'SELECT COUNT(*) as count FROM items'
        )
        .get()

      console.log(
        'TOTAL ITEMS IN DATABASE:',
        count
      )

      return {
        success: true,
        count: importedCount
      }
    } catch (error) {
      console.error(error)

      return {
        success: false,
        message: 'Failed to import menu'
      }
    }
  })

  ipcMain.handle('menu:deleteAll', () => {
  try {
    const db = getDb()

    db.prepare('DELETE FROM items').run()

    return {
      success: true
    }
  } catch (error) {
    console.error(error)

    return {
      success: false
    }
  }
})

ipcMain.handle(
  'menu:deleteItem',
  (_, id: number) => {
    try {
      const db = getDb()

      db.prepare(
        'DELETE FROM items WHERE id = ?'
      ).run(id)

      return {
        success: true
      }
    } catch (error) {
      console.error(error)

      return {
        success: false
      }
    }
  }
)
ipcMain.handle(
  'print:html',
  async (_, html: string) => {
    const printWindow = new BrowserWindow({
      show: false,
      autoHideMenuBar: true
    })

    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    )

    printWindow.webContents.print(
      {
        silent: false,
        printBackground: true
      },
      () => {
        printWindow.close()
      }
    )
  }
)

ipcMain.handle(
  'orders:getHistory',
  (
    _,
    {
      page = 1,
      limit = 20,
      date,
      search
    }
  ) => {
    const db = getDb()

    const offset = (page - 1) * limit

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (date) {
      where += `
        AND DATE(created_at)=DATE(?)
      `
      params.push(date)
    }

    if (search) {
      where += `
        AND (
          order_number LIKE ?
          OR order_data LIKE ?
        )
      `

      params.push(`%${search}%`)
      params.push(`%${search}%`)
    }

    const orders = db
      .prepare(`
        SELECT *
        FROM orders
        ${where}
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
      `)
      .all(
        ...params,
        limit,
        offset
      )

    const total = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM orders
        ${where}
      `)
      .get(...params)

    return {
      orders,
      total: total.count
    }
  }
)
ipcMain.handle(
  'orders:create',
  (_, order) => {
    const db = getDb()

    const result = db
      .prepare(`
        INSERT INTO orders (
          order_number,
          order_data,
          total_amount,
          order_status
        )
        VALUES (?, ?, ?, ?)
      `)
      .run(
        order.orderNumber,
        JSON.stringify(order.items),
        order.total,
        'completed'
      )

    return {
      success: true,
      id: result.lastInsertRowid
    }
  }
)
ipcMain.handle('dashboard:getStats', () => {
  const db = getDb()

  const todayOrders = db
    .prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE DATE(created_at)=DATE('now','localtime')
    `)
    .get() as any

  const revenue = db
    .prepare(`
      SELECT COALESCE(SUM(total_amount),0) as total
      FROM orders
      WHERE DATE(created_at)=DATE('now','localtime')
    `)
    .get() as any

  const menuItems = db
    .prepare(`
      SELECT COUNT(*) as count
      FROM items
    `)
    .get() as any

  const users = db
    .prepare(`
      SELECT COUNT(*) as count
      FROM users
    `)
    .get() as any

  const recentOrders = db
    .prepare(`
      SELECT
        order_number,
        total_amount,
        created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 10
    `)
    .all()

  return {
    todayOrders: todayOrders.count,
    todayRevenue: revenue.total,
    menuItems: menuItems.count,
    users: users.count,
    recentOrders
  }
})

ipcMain.handle(
  'orders:getNextOrderNumber',
  () => {
    const db = getDb()

    const lastOrder = db
      .prepare(`
        SELECT id
        FROM orders
        ORDER BY id DESC
        LIMIT 1
      `)
      .get() as any

    const nextId =
      (lastOrder?.id || 0) + 1

    return `MM${String(nextId).padStart(
      5,
      '0'
    )}`
  }
)

}