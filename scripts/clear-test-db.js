const { Pool } = require('pg');
require('dotenv').config({ path: '.env.testing' });

async function clearTestDatabase() {
  console.log('Clearing test database...');
  
  // Create PostgreSQL connection
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER, // Note: 'user' not 'username'
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });
  
  console.log('Connecting to PostgreSQL:', {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB
  });

  try {
    // Clear devices table first (due to foreign key constraints)
    await pool.query('DELETE FROM devices');
    console.log('✅ Devices table cleared');
    
    // Clear users table
    await pool.query('DELETE FROM users');
    console.log('✅ Users table cleared');
    
    console.log('🎉 Test database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing test database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Only run if NODE_ENV is testing
if (process.env.NODE_ENV !== 'testing') {
  console.error('❌ This script can only be run in testing environment');
  process.exit(1);
}

clearTestDatabase();
