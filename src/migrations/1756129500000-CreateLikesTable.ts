import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLikesTable1756129500000 implements MigrationInterface {
  name = 'CreateLikesTable1756129500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create likes table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "likes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "status" VARCHAR(10) NOT NULL CHECK ("status" IN ('Like','Dislike','None')),
        "userId" uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
        "postId" uuid NOT NULL REFERENCES "posts"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Unique constraint for upsert semantics
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_likes_post_user'
        ) THEN
          ALTER TABLE "likes" ADD CONSTRAINT uq_likes_post_user UNIQUE ("postId", "userId");
        END IF;
      END $$;
    `);

    // If legacy post_likes exists, migrate data
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'post_likes'
        ) THEN
          INSERT INTO "likes" ("status", "userId", "postId", "createdAt")
          SELECT pl.status, pl.user_id, pl.post_id, COALESCE(pl.added_at, CURRENT_TIMESTAMP)
          FROM post_likes pl
          ON CONFLICT ("postId", "userId") DO NOTHING;

          DROP TABLE post_likes;
        END IF;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate legacy table for rollback (minimal columns)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(10) NOT NULL CHECK (status IN ('Like','Dislike','None')),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id)
      );
    `);

    // Move data back
    await queryRunner.query(`
      INSERT INTO post_likes (post_id, user_id, status, added_at)
      SELECT "postId", "userId", "status", COALESCE("createdAt", CURRENT_TIMESTAMP)
      FROM "likes"
      ON CONFLICT (post_id, user_id) DO NOTHING;
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "likes"`);
  }
}
