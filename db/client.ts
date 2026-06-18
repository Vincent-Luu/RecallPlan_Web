import { createRequire } from "node:module";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const require = createRequire(import.meta.url);
const provider = process.env.DATABASE_PROVIDER || "postgresql";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (provider === "sqlite") {
  const g = globalThis as any;
  const fs = require("node:fs");
  const path = require("node:path");

  // Resolve to absolute path to avoid CWD issues in different run contexts
  const rawPath = process.env.DATABASE_FILE || "./data/recallplan_web.db";
  const dbPath = path.resolve(process.cwd(), rawPath);

  // ── Global singleton: avoid creating multiple in‑memory instances ──
  // Next.js dev mode may re‑evaluate this module; globalThis survives reloads.
  if (!g.__dbSingleton) {
    // Ensure the parent directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load existing database file or start fresh
    let buffer: Uint8Array | undefined;
    if (fs.existsSync(dbPath)) {
      buffer = fs.readFileSync(dbPath);
      console.log(`[DB] Loaded existing database: ${dbPath} (${((buffer as Uint8Array).length / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`[DB] No database file found at ${dbPath}, creating new empty database`);
    }

    // sql.js is a pure JavaScript/WASM SQLite implementation — no native deps needed
    const initSqlJs = require("sql.js").default || require("sql.js");

    // Resolve the WASM file path — sql.js canʼt find it automatically in sandboxed environments
    const wasmPath = path.resolve(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");

    g.__dbSingleton = {
      _ready: (async () => {
        const SQL = await initSqlJs({ locateFile: () => wasmPath });
        const sqlDb = new SQL.Database(buffer);
        sqlDb.run("PRAGMA foreign_keys = ON");

        // Auto-create tables on first run (idempotent)
        sqlDb.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            status TEXT DEFAULT 'approved' NOT NULL,
            role TEXT DEFAULT 'user' NOT NULL,
            gaokao_enabled INTEGER DEFAULT 1 NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()) NOT NULL
          )
        `);
        // Migration: add gaokao_enabled column if missing (for existing databases)
        try { sqlDb.run("ALTER TABLE users ADD COLUMN gaokao_enabled INTEGER DEFAULT 1 NOT NULL"); } catch (_) { /* column already exists */ }
        // Migration: add status column if missing (for existing databases)
        try { sqlDb.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved' NOT NULL"); } catch (_) { /* column already exists */ }
        sqlDb.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            title TEXT NOT NULL,
            tag TEXT,
            created_at INTEGER DEFAULT (unixepoch()) NOT NULL
          )
        `);
        sqlDb.run(`
          CREATE TABLE IF NOT EXISTS task_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER REFERENCES tasks(id) NOT NULL,
            schedule_date TEXT NOT NULL,
            status INTEGER DEFAULT 0 NOT NULL,
            type TEXT DEFAULT 'regular' NOT NULL
          )
        `);
        // Migration: add type column if missing (for existing databases)
        try { sqlDb.run("ALTER TABLE task_logs ADD COLUMN type TEXT DEFAULT 'regular' NOT NULL"); } catch (_) { /* column already exists */ }
        sqlDb.run(`
          CREATE TABLE IF NOT EXISTS memos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            title TEXT NOT NULL,
            content TEXT DEFAULT '' NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
            updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
          )
        `);

        const { drizzle } = require("drizzle-orm/sql-js");
        const dbInstance = drizzle(sqlDb);

        // ── Persistence helpers ──
        let isDirty = false;
        let saveTimeout: ReturnType<typeof setTimeout> | null = null;

        function saveToDisk() {
          if (!isDirty) return;
          try {
            const data = sqlDb.export();
            fs.writeFileSync(dbPath, Buffer.from(data));
            console.log(`[DB] Persisted to ${dbPath} (${(data.length / 1024).toFixed(1)} KB)`);
            isDirty = false;
          } catch (err) {
            console.error(`[DB] CRITICAL: Failed to write database to ${dbPath}:`, err);
          }
        }

        function scheduleSaveToDisk() {
          isDirty = true;
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            saveToDisk();
            saveTimeout = null;
          }, 100);
        }

        const WRITE_SQL_RE = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\b/i;

        // Wrap sqlDb.run / sqlDb.exec to auto-persist after write operations
        const _run = sqlDb.run.bind(sqlDb);
        sqlDb.run = function (sql: string, ...args: unknown[]) {
          const result = _run(sql, ...args);
          if (WRITE_SQL_RE.test(sql)) scheduleSaveToDisk();
          return result;
        };

        const _exec = sqlDb.exec.bind(sqlDb);
        sqlDb.exec = function (sql: string, ...args: unknown[]) {
          const result = _exec(sql, ...args);
          if (WRITE_SQL_RE.test(sql)) scheduleSaveToDisk();
          return result;
        };

        // Wrap sqlDb.prepare to catch write operations via prepared statements (used by Drizzle ORM)
        const _prepare = sqlDb.prepare.bind(sqlDb);
        sqlDb.prepare = function (sql: string, ...args: unknown[]) {
          const stmt = _prepare(sql, ...args);
          if (WRITE_SQL_RE.test(sql)) {
            const _stmtRun = stmt.run.bind(stmt);
            stmt.run = function (...runArgs: unknown[]) {
              const result = _stmtRun(...runArgs);
              scheduleSaveToDisk();
              return result;
            };
          }
          return stmt;
        };

        // Safety net: persist periodically without logging
        setInterval(() => {
          try {
            const data = sqlDb.export();
            fs.writeFileSync(dbPath, Buffer.from(data));
            isDirty = false;
          } catch {
            // silent
          }
        }, 5000);

        // Save on process exit
        process.on("exit", saveToDisk);
        process.on("SIGINT", () => { saveToDisk(); process.exit(); });
        process.on("SIGTERM", () => { saveToDisk(); process.exit(); });

        // Initial persist
        isDirty = true;
        saveToDisk();

        return { db: dbInstance, sqlDb };
      })(),
    };
  }

  // ── Block until the singleton is ready (first call initializes, subsequent calls resolve immediately) ──
  const singleton = await g.__dbSingleton._ready;
  db = singleton.db;
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in the environment variables");
  }
  const { neon } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");

  const sql = neon(process.env.DATABASE_URL);
  const rawDb = drizzle({ client: sql });

  /**
   * Recursively wraps Drizzle query builders so that .run() is always
   * available as a no-op passthrough.  Skips Promise protocol methods
   * (`then`, `catch`, `finally`) to avoid "Promise.prototype.then called
   * on incompatible receiver" — intercepting them changes the `this`
   * binding and breaks Drizzle's thenable resolution.
   */
  function withRun(result: any): any {
    if (!result || typeof result !== "object") return result;
    if ("run" in result) return result;

    return new Proxy(result, {
      get(target, prop, receiver) {
        if (prop === "run") return () => target;
        // Pass through Promise protocol untouched
        if (prop === "then" || prop === "catch" || prop === "finally") {
          return Reflect.get(target, prop, receiver);
        }
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "function") {
          return function (this: any, ...args: any[]) {
            return withRun(value.apply(this ?? target, args));
          };
        }
        return value;
      },
    });
  }

  db = new Proxy(rawDb, {
    get(target, prop, receiver) {
      // Let Promise protocol pass through on the root `db` object too
      if (prop === "then" || prop === "catch" || prop === "finally") {
        return Reflect.get(target, prop, receiver);
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return function (this: any, ...args: any[]) {
          return withRun(value.apply(this ?? target, args));
        };
      }
      return value;
    },
  });
}

export { db };
