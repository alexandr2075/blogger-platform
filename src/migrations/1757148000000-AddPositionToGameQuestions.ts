import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPositionToGameQuestions1757148000000 implements MigrationInterface {
    name = 'AddPositionToGameQuestions1757148000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('game-questions');
        if (!hasTable) return;
        const table = await queryRunner.getTable('game-questions');
        const hasColumn = table?.columns.some(c => c.name === 'position');
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "game-questions" ADD COLUMN "position" integer`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('game-questions');
        if (!hasTable) return;
        const table = await queryRunner.getTable('game-questions');
        const hasColumn = table?.columns.some(c => c.name === 'position');
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "game-questions" DROP COLUMN "position"`);
        }
    }
}


