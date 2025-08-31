import * as dotenv from 'dotenv';
import dataSource from '../src/data-source';

// Decide environment: prefer testing when running under Jest
const env = process.env.NODE_ENV || (process.env.JEST_WORKER_ID ? 'testing' : 'development');
dotenv.config({ path: `.env.${env}` });

export async function runMigrations(): Promise<void> {
  await dataSource.initialize();
  try {
    console.log(`🚀 Running TypeORM migrations (env: ${env})...`);
    const results = await dataSource.runMigrations();
    results.forEach((m) => console.log(`✅ Applied migration: ${m.name}`));
    console.log('🎉 All migrations completed successfully!');
  } finally {
    await dataSource.destroy();
  }
}

// Allow running directly: `ts-node scripts/run-migrations.ts`
if (require.main === module) {
  runMigrations().catch((err) => {
    console.error('❌ Migration execution error:', err);
    process.exit(1);
  });
}
