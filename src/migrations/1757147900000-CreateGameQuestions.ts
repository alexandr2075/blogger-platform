import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGameQuestions1757147900000 implements MigrationInterface {
    name = 'CreateGameQuestions1757147900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('game-questions');
        if (!hasTable) {
            await queryRunner.query(`
                CREATE TABLE "game-questions" (
                    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "gameId" uuid NOT NULL,
                    "questionId" uuid NOT NULL,
                    "position" integer NOT NULL,
                    CONSTRAINT "fk_game_questions_game" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE,
                    CONSTRAINT "fk_game_questions_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE
                )
            `);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_game_questions_game" ON "game-questions" ("gameId")`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_game_questions_question" ON "game-questions" ("questionId")`);
            await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uq_game_questions_game_position" ON "game-questions" ("gameId", "position")`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('game-questions');
        if (hasTable) {
            await queryRunner.query(`DROP TABLE "game-questions"`);
        }
    }
}


