import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

let db: Database.Database

export function initializeDatabase() {
  const dbPath = path.join(
    app.getPath('userData'),
    'mutton-matka.db'
  )
   console.log('User Data Path:', app.getPath('userData'))
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')

  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    item_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    order_number TEXT NOT NULL UNIQUE,

    customer_name TEXT,
    customer_phone TEXT,

    total_amount REAL NOT NULL,
    total_items INTEGER DEFAULT 0,

    order_type TEXT DEFAULT 'dine_in',

    bill_printed INTEGER DEFAULT 0,
    kot_printed INTEGER DEFAULT 0,

    order_status TEXT DEFAULT 'completed',

    created_by INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    order_id INTEGER NOT NULL,

    item_id INTEGER,

    item_name TEXT NOT NULL,

    variant_name TEXT,

    unit_price REAL NOT NULL,

    quantity INTEGER NOT NULL,

    line_total REAL NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE,

    FOREIGN KEY(item_id)
      REFERENCES items(id)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_number
    ON orders(order_number);

  CREATE INDEX IF NOT EXISTS idx_orders_created
    ON orders(created_at);

  CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON order_items(order_id);

  CREATE INDEX IF NOT EXISTS idx_order_items_name
    ON order_items(item_name);
`)

  createDefaultAdmin()
}

export function getDb() {
  return db
}

function createDefaultAdmin() {
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get('admin')

  if (!existing) {
    db.prepare(`
      INSERT INTO users
      (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run(
      'admin',
      'admin123', // Replace with bcrypt hash
      'admin'
    )

    console.log('Default admin created')
  }
}