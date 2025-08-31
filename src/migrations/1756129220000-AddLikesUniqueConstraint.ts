import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLikesUniqueConstraint1756129220000 implements MigrationInterface {
    name = 'AddLikesUniqueConstraint1756129220000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First drop existing constraint if it exists (safe method)
        await queryRunner.query(`
            DO $$ 
            BEGIN
              IF EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'UQ_likes_postId_userId'
              ) THEN
                ALTER TABLE "likes" DROP CONSTRAINT "UQ_likes_postId_userId";
              END IF;
            END $$;
        `);
        
        // Add the unique constraint
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "UQ_likes_postId_userId" UNIQUE ("postId", "userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the unique constraint
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "UQ_likes_postId_userId"`);
    }
}
