import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 内联迁移：按序执行，全部 IF NOT EXISTS（不做迁移框架，规模小）
const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'teacher',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_type TEXT NOT NULL,
    grade_range TEXT NOT NULL DEFAULT '1-6',
    meta TEXT NOT NULL DEFAULT '{}',
    plan_json TEXT NOT NULL DEFAULT '{}',
    script_md TEXT,
    materials_json TEXT,
    safety_json TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    is_shared INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS corpus_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    course_type TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id TEXT NOT NULL,
    course_type TEXT NOT NULL,
    section TEXT NOT NULL,
    page_no INTEGER,
    content TEXT NOT NULL,
    embedding BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_chunks_type ON chunks(course_type)`,
  `CREATE INDEX IF NOT EXISTS idx_chunks_section ON chunks(section)`,
];

for (const sql of migrations) db.exec(sql);
