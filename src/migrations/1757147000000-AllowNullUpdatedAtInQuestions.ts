import { MigrationInterface, QueryRunner } from "typeorm";

export class AllowNullUpdatedAtInQuestions1757147000000 implements MigrationInterface {
    name = 'AllowNullUpdatedAtInQuestions1757147000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "updatedAt" DROP NOT NULL`);
        await queryRunner.query(`UPDATE "questions" SET "updatedAt" = NULL WHERE "updatedAt" = "createdAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "questions" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "updatedAt" SET NOT NULL`);
    }
}
