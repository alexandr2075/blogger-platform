const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
// Load environment based on context: prefer test env when running under Jest
const envPath =
  process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID
    ? '.env.test'
    : '.env.development';
require('dotenv').config({ path: envPath });

// PostgreSQL connection settings
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
});

async function runMigrations() {
  try {
    console.log('🚀 Starting migrations...');
    const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
    console.log(`🧪 Environment: ${isTest ? 'test' : 'development'}`);
    
    // Check if tables exist
    const checkUsersResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const checkDevicesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
      );
    `);
    
    let usersExists = checkUsersResult.rows[0].exists;
    let devicesExists = checkDevicesResult.rows[0].exists;
    
    // In test env, force a clean schema to avoid drifting columns (e.g., missing id)
    if (isTest) {
      console.log('🧹 Test mode: dropping tables if they exist to ensure clean schema');
      await pool.query(`DROP TABLE IF EXISTS devices CASCADE;`);
      await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);
      usersExists = false;
      devicesExists = false;
    }
    
    // List of migrations to execute
    const migrations = [];
    
    if (!usersExists) {
      migrations.push('001_create_users_table.sql');
    } else {
      console.log('ℹ️  Users table already exists, skipping migration');
    }
    
    if (!devicesExists) {
      migrations.push('002_create_devices_table.sql');
    } else {
      console.log('ℹ️  Devices table already exists, skipping migration');
    }
    
    if (migrations.length === 0) {
      console.log('✨ All tables already exist, no migrations required!');
      return true;
    }
    
    for (const migrationFile of migrations) {
      console.log(`📄 Executing migration: ${migrationFile}`);
      
      const migrationPath = path.join(__dirname, '../migrations', migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await pool.query(migrationSQL);
      
      console.log(`✅ Migration ${migrationFile} completed successfully!`);
    }
    
    console.log('🎉 All migrations completed successfully!');
    console.log('📋 Created/updated tables: users, devices with indexes and triggers');
    return true;
  } catch (error) {
    console.error('❌ Migration execution error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Export for programmatic use (e.g., from tests)
module.exports = { runMigrations };

// Allow running as a script: `node scripts/run-migrations.js`
if (require.main === module) {
  runMigrations().catch(() => process.exit(1));
}
