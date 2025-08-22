import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Initialize database connection
const DATA_DIR = process.env.DATA_DIR || '/home/perplexica/data';
const sqlite = new Database(path.join(DATA_DIR, './db.sqlite'));
const db = drizzle(sqlite, { schema });

// Run migration
migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
