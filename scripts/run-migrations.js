const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

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
    
    const usersExists = checkUsersResult.rows[0].exists;
    const devicesExists = checkDevicesResult.rows[0].exists;
    
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
      return;
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
    
  } catch (error) {
    console.error('❌ Migration execution error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
