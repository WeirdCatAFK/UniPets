import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import util from 'util';
import sqlite3 from 'sqlite3';

class DatabaseManager {
  constructor() {
    this.dbPath = path.resolve('data', 'database.db');
    this.schemaPath = path.resolve('config', 'schema.sql');
    this.db = null;
  }

  async initialize() {
    try {
      await this.setupDatabase();
      this.promisifyDatabaseMethods();

      const isIntact = await this.checkDatabaseIntegrity();
      if (isIntact) {
        console.log('✔ Database integrity OK');
      } else {
        console.log('⚠️ Integrity check failed — initializing database...');
        await this.runInitQueries();
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async setupDatabase() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true });
      console.log(`Created database directory at ${dir}`);
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) throw err;
      console.log(`Connected to database at ${this.dbPath}`);
    });
  }

  promisifyDatabaseMethods() {
    this.run = util.promisify(this.db.run.bind(this.db));
    this.get = util.promisify(this.db.get.bind(this.db));
    this.all = util.promisify(this.db.all.bind(this.db));
    this.each = util.promisify(this.db.each.bind(this.db));
    this.exec = util.promisify(this.db.exec.bind(this.db));
  }

  async checkDatabaseIntegrity() {
    try {
      const tables = await this.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%';
      `);
      return tables.length >= 1;
    } catch (err) {
      console.error('Integrity check failed:', err);
      return false;
    }
  }

  async runInitQueries() {
    try {
      const sql = await fsp.readFile(this.schemaPath, 'utf8');
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      await this.run('BEGIN TRANSACTION;');

      for (const stmt of statements) {
        try {
          await this.run(stmt + ';');
        } catch (err) {
          console.error('Error executing statement:', stmt);
          throw err;
        }
      }

      await this.run('COMMIT;');
      console.log('✅ Database initialized from schema.sql');
    } catch (err) {
      await this.run('ROLLBACK;');
      console.error('❌ Failed during schema initialization:', err);
      throw err;
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export default new DatabaseManager();
