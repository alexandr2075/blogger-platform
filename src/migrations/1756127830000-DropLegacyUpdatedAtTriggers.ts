import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyUpdatedAtTriggers1756127830000 implements MigrationInterface {
  name = 'DropLegacyUpdatedAtTriggers1756127830000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop known triggers if they exist
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_users_updated_at ON users';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_blogs_updated_at') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_devices_updated_at') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_devices_updated_at ON devices';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_posts_updated_at ON posts';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS update_comments_updated_at ON comments';
      END IF;
    END $$;`);

    // Drop the legacy trigger function globally (removes any remaining dependent triggers)
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: we don't recreate legacy triggers
  }
}
