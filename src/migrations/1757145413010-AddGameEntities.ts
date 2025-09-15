import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGameEntities1757145413010 implements MigrationInterface {
    name = 'AddGameEntities1757145413010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."answers_status_enum" AS ENUM('Correct', 'Incorrect')`);
        await queryRunner.query(`CREATE TABLE "answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "player_id" uuid NOT NULL, "question_id" uuid NOT NULL, "status" "public"."answers_status_enum" NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "playerId" uuid, CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."player_status_enum" AS ENUM('Win', 'Lose', 'Draw')`);
        await queryRunner.query(`CREATE TABLE "player" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" integer NOT NULL DEFAULT '0', "status" "public"."player_status_enum", "userId" uuid, CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "answers" text array NOT NULL, "gameId" uuid, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstPlayerId" uuid NOT NULL, "secondPlayerId" uuid, CONSTRAINT "REL_e2e6d984f70f61e5435c3be619" UNIQUE ("firstPlayerId"), CONSTRAINT "REL_ee762a5104680b6af6cf7b94f6" UNIQUE ("secondPlayerId"), CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "FK_2db19a3852a73462e7532965c82" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "player" ADD CONSTRAINT "FK_7687919bf054bf262c669d3ae21" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_410d69e359df7d12e549b167ddc" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_e2e6d984f70f61e5435c3be619d" FOREIGN KEY ("firstPlayerId") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game" ADD CONSTRAINT "FK_ee762a5104680b6af6cf7b94f61" FOREIGN KEY ("secondPlayerId") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_ee762a5104680b6af6cf7b94f61"`);
        await queryRunner.query(`ALTER TABLE "game" DROP CONSTRAINT "FK_e2e6d984f70f61e5435c3be619d"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_410d69e359df7d12e549b167ddc"`);
        await queryRunner.query(`ALTER TABLE "player" DROP CONSTRAINT "FK_7687919bf054bf262c669d3ae21"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_2db19a3852a73462e7532965c82"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TABLE "player"`);
        await queryRunner.query(`DROP TYPE "public"."player_status_enum"`);
        await queryRunner.query(`DROP TABLE "answers"`);
        await queryRunner.query(`DROP TYPE "public"."answers_status_enum"`);
    }

}
