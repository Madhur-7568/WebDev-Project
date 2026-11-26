/**
 * Dual-Mode PostgreSQL Connection Adapter
 * - Default: Embedded In-Built PostgreSQL (@electric-sql/pglite) persisted in server/data/postgres_db
 * - Production: External PostgreSQL (node-postgres 'pg') when DATABASE_URL is configured
 */
const fs = require('fs');
const path = require('path');

let pgPool = null;
let pgliteClient = null;
let dbMode = 'uninitialized';

const connectDB = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith('postgres')) {
    try {
      const { Pool } = require('pg');
      pgPool = new Pool({ connectionString: databaseUrl });
      await pgPool.query('SELECT 1');
      dbMode = 'external-postgres';
      console.log('✅ Connected to External PostgreSQL database.');
      await initializeSchemaAndSeed();
      return true;
    } catch (error) {
      console.warn(`⚠️  External PostgreSQL failed (${error.message}). Falling back to In-Built PGlite.`);
      pgPool = null;
    }
  }

  // Embedded In-Built PostgreSQL (PGlite) — Zero external setup required
  const { PGlite } = require('@electric-sql/pglite');
  const dataDir = path.join(__dirname, '../../data/postgres_db');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    pgliteClient = new PGlite(dataDir);
    await pgliteClient.waitReady;
  } catch (err) {
    console.warn('⚠️  PGlite data directory locked/corrupted after ungraceful stop. Re-initializing clean Postgres store...');
    fs.rmSync(dataDir, { recursive: true, force: true });
    fs.mkdirSync(dataDir, { recursive: true });
    pgliteClient = new PGlite(dataDir);
    await pgliteClient.waitReady;
  }
  dbMode = 'embedded-pglite';
  console.log(`✅ In-Built PostgreSQL (PGlite) ready! Data persisted at: ${dataDir}`);

  await initializeSchemaAndSeed();
  return true;
};

const closeDB = async () => {
  try {
    if (pgliteClient) {
      await pgliteClient.close();
      pgliteClient = null;
    }
    if (pgPool) {
      await pgPool.end();
      pgPool = null;
    }
  } catch (e) {
    // Ignore close errors during shutdown
  }
};

/**
 * Execute parameterized SQL queries uniformly across PGlite and pg.Pool
 */
const query = async (text, params = []) => {
  if (dbMode === 'external-postgres' && pgPool) {
    return pgPool.query(text, params);
  }
  if (dbMode === 'embedded-pglite' && pgliteClient) {
    return pgliteClient.query(text, params);
  }
  throw new Error('PostgreSQL database is not initialized yet.');
};

/**
 * Execute raw multi-statement SQL (used for schema DDL)
 */
const execRaw = async (sql) => {
  if (dbMode === 'external-postgres' && pgPool) {
    return pgPool.query(sql);
  }
  if (dbMode === 'embedded-pglite' && pgliteClient) {
    return pgliteClient.exec(sql);
  }
  throw new Error('PostgreSQL database is not initialized yet.');
};

const initializeSchemaAndSeed = async () => {
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await execRaw(schemaSql);

  const { seedDatabase } = require('../db/seed');
  await seedDatabase({ query });

  const { syncAllTablesToCsv } = require('../db/csvSync');
  await syncAllTablesToCsv(query);
};

const getDbMode = () => dbMode;

module.exports = {
  connectDB,
  closeDB,
  query,
  execRaw,
  getDbMode
};
