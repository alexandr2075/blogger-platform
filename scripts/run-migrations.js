const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
// Load environment based on context: prefer test env when running under Jest
const isJest = !!process.env.JEST_WORKER_ID;
const isTesting = process.env.NODE_ENV === 'testing' || isJest;
const envPath = isTesting
  ? (require('fs').existsSync('.env.testing') ? '.env.testing' : (require('fs').existsSync('.env.test') ? '.env.test' : '.env.development'))
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
    const isTest = process.env.NODE_ENV === 'testing' || process.env.JEST_WORKER_ID;
    console.log(`🧪 Environment: ${isTest ? 'testing' : 'development'}`);
    
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
    const checkBlogsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blogs'
      );
    `);
    const checkPostsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'posts'
      );
    `);
    const checkPostLikesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_likes'
      );
    `);
    
    let usersExists = checkUsersResult.rows[0].exists;
    let devicesExists = checkDevicesResult.rows[0].exists;
    let blogsExists = checkBlogsResult.rows[0].exists;
    let postsExists = checkPostsResult.rows[0].exists;
    let postLikesExists = checkPostLikesResult.rows[0].exists;
    
    // In test env, force a clean schema to avoid drifting columns (e.g., missing id)
    if (isTest) {
      console.log('🧹 Test mode: dropping tables if they exist to ensure clean schema');
      await pool.query(`DROP TABLE IF EXISTS post_likes CASCADE;`);
      await pool.query(`DROP TABLE IF EXISTS posts CASCADE;`);
      await pool.query(`DROP TABLE IF EXISTS blogs CASCADE;`);
      await pool.query(`DROP TABLE IF EXISTS devices CASCADE;`);
      await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);
      usersExists = false;
      devicesExists = false;
      blogsExists = false;
      postsExists = false;
      postLikesExists = false;
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
    
    if (!blogsExists) {
      migrations.push('003_create_blogs_table.sql');
    } else {
      console.log('ℹ️  Blogs table already exists, skipping migration');
    }

    if (!postsExists || !postLikesExists) {
      migrations.push('004_create_posts_and_likes.sql');
    } else {
      console.log('ℹ️  Posts and post_likes tables already exist, skipping migration');
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
    console.log('📋 Created/updated tables: users, devices, blogs, posts, post_likes');
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
