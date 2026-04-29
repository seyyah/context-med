'use strict';

const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');

const DEFAULT_DATABASE_NAME = 'social-agent.sqlite';

function defaultDatabasePath() {
  return process.env.SOCIAL_AGENT_DB_PATH || path.join(process.cwd(), 'out', DEFAULT_DATABASE_NAME);
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readDatabaseBytes(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath);
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') {
    throw new TypeError('Workflow item must be an object.');
  }

  const id = String(item.id || '').trim();
  const type = String(item.type || '').trim();
  const title = String(item.title || '').trim();
  const status = String(item.status || 'draft').trim();

  if (!id) {
    throw new TypeError('Workflow item id is required.');
  }

  if (!type) {
    throw new TypeError('Workflow item type is required.');
  }

  if (!title) {
    throw new TypeError('Workflow item title is required.');
  }

  return {
    id,
    type,
    title,
    status,
    payload: item.payload && typeof item.payload === 'object' ? item.payload : {},
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function parseRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    status: row.status,
    payload: JSON.parse(row.payload || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createSchema(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS workflow_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  database.run('CREATE INDEX IF NOT EXISTS idx_workflow_items_type ON workflow_items(type);');
  database.run('CREATE INDEX IF NOT EXISTS idx_workflow_items_status ON workflow_items(status);');
}

function getSingleRow(database, query, params) {
  const statement = database.prepare(query);

  try {
    statement.bind(params);
    return statement.step() ? statement.getAsObject() : null;
  } finally {
    statement.free();
  }
}

function getRows(database, query, params) {
  const statement = database.prepare(query);
  const rows = [];

  try {
    statement.bind(params);
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
  } finally {
    statement.free();
  }

  return rows;
}

async function openWorkflowStore(options = {}) {
  const dbPath = path.resolve(options.dbPath || defaultDatabasePath());
  const SQL = await initSqlJs();
  const bytes = readDatabaseBytes(dbPath);
  const database = bytes ? new SQL.Database(bytes) : new SQL.Database();

  createSchema(database);

  function persist() {
    ensureParentDirectory(dbPath);
    fs.writeFileSync(dbPath, Buffer.from(database.export()));
  }

  return {
    dbPath,

    async saveItem(item) {
      const normalized = normalizeItem(item);
      const existing = getSingleRow(database, 'SELECT created_at FROM workflow_items WHERE id = ?', [normalized.id]);
      const createdAt = existing ? existing.created_at : normalized.createdAt;

      database.run(
        `
          INSERT INTO workflow_items (id, type, title, status, payload, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            type = excluded.type,
            title = excluded.title,
            status = excluded.status,
            payload = excluded.payload,
            updated_at = excluded.updated_at;
        `,
        [
          normalized.id,
          normalized.type,
          normalized.title,
          normalized.status,
          JSON.stringify(normalized.payload),
          createdAt,
          normalized.updatedAt
        ]
      );
      persist();

      return this.getItem(normalized.id);
    },

    async getItem(id) {
      const row = getSingleRow(database, 'SELECT * FROM workflow_items WHERE id = ?', [String(id)]);
      return row ? parseRow(row) : null;
    },

    async listItems(type) {
      const rows = type
        ? getRows(database, 'SELECT * FROM workflow_items WHERE type = ? ORDER BY updated_at DESC', [String(type)])
        : getRows(database, 'SELECT * FROM workflow_items ORDER BY updated_at DESC', []);

      return rows.map(parseRow);
    },

    async deleteItem(id) {
      database.run('DELETE FROM workflow_items WHERE id = ?', [String(id)]);
      persist();
    },

    async close() {
      persist();
      database.close();
    }
  };
}

module.exports = {
  defaultDatabasePath,
  openWorkflowStore
};
