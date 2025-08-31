import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCamelCaseTables1756129240000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing tables if they exist
    await queryRunner.query(`DROP TABLE IF EXISTS "comment_likes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blogs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "devices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    // Create users table with camelCase columns
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "login" varchar NOT NULL UNIQUE,
        "email" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" timestamp with time zone,
        "emailConfirmation" jsonb,
        "confirmationCode" varchar,
        "expirationDate" timestamp with time zone,
        "isConfirmed" boolean DEFAULT false,
        "passwordRecovery" jsonb,
        "recoveryCode" varchar
      )
    `);

    // Create blogs table with camelCase columns
    await queryRunner.query(`
      CREATE TABLE "blogs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" varchar NOT NULL,
        "websiteUrl" varchar NOT NULL,
        "isMembership" boolean DEFAULT false,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" timestamp with time zone,
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create posts table with camelCase columns
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "shortDescription" varchar NOT NULL,
        "content" varchar NOT NULL,
        "blogId" uuid NOT NULL REFERENCES "blogs"("id") ON DELETE CASCADE,
        "blogName" varchar NOT NULL,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" timestamp with time zone
      )
    `);

    // Create comments table with camelCase columns
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "content" varchar NOT NULL,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "postId" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "userLogin" varchar NOT NULL,
        "deletedAt" timestamp with time zone
      )
    `);

    // Create devices table with camelCase columns
    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "deviceName" varchar NOT NULL,
        "ip" varchar NOT NULL,
        "lastActiveDate" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create likes table with camelCase columns
    await queryRunner.query(`
      CREATE TABLE "likes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "postId" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" varchar NOT NULL CHECK ("status" IN ('Like', 'Dislike')),
        "addedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("postId", "userId")
      )
    `);

    // Create comment_likes table with camelCase columns
    await queryRunner.query(`
      CREATE TABLE "comment_likes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "commentId" uuid NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" varchar NOT NULL CHECK ("status" IN ('Like', 'Dislike')),
        "addedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("commentId", "userId")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_blogs_deletedAt" ON "blogs"("deletedAt")`);
    await queryRunner.query(`CREATE INDEX "idx_posts_createdAt" ON "posts"("createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_posts_deletedAt" ON "posts"("deletedAt")`);
    await queryRunner.query(`CREATE INDEX "idx_comments_createdAt" ON "comments"("createdAt")`);
    await queryRunner.query(`CREATE INDEX "idx_comments_deletedAt" ON "comments"("deletedAt")`);
    await queryRunner.query(`CREATE INDEX "idx_comment_likes_commentId" ON "comment_likes"("commentId")`);
    await queryRunner.query(`CREATE INDEX "idx_comment_likes_userId" ON "comment_likes"("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables
    await queryRunner.query(`DROP TABLE IF EXISTS "comment_likes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blogs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "devices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
  }
}
