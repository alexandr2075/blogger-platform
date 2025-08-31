import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelaxPostsUserId1756129600000 implements MigrationInterface {
  name = 'RelaxPostsUserId1756129600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "posts" ALTER COLUMN "userId" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // WARNING: This may fail if rows exist with NULL userId
    await queryRunner.query(`
      ALTER TABLE "posts" ALTER COLUMN "userId" SET NOT NULL;
    `);
  }
}
