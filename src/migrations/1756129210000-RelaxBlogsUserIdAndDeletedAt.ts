import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelaxBlogsUserIdAndDeletedAt1756129210000 implements MigrationInterface {
  name = 'RelaxBlogsUserIdAndDeletedAt1756129210000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make blogs.userId nullable to allow creating blogs without owner in admin context
    await queryRunner.query(`ALTER TABLE "blogs" ALTER COLUMN "userId" DROP NOT NULL`);
    // Ensure blogs.deletedAt exists (used for soft delete filtering)
    await queryRunner.query(`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert deletedAt addition
    await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "deletedAt"`);
    // Revert userId nullability (set NOT NULL back)
    await queryRunner.query(`ALTER TABLE "blogs" ALTER COLUMN "userId" SET NOT NULL`);
  }
}
