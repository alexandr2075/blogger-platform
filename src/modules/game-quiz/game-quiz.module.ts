import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameQuestions } from "./domain/game-questions.entity";
import { Game } from "./domain/game.entity";
import { Player } from "./domain/player.entity";
import { Questions } from "./domain/questions.entity";

import { UsersModule } from "../users/users.module";
import { Answers } from "./domain/answers.entity";
import { GameAdminController } from "./game-admin/game-admin.controller";
import { GameAdminRepository } from "./game-admin/game-admin.repository";
import { GameAdminService } from "./game-admin/game-admin.service";
import { GamePublicController } from "./game-public/game.controller";
import { GameRepository } from "./game-public/game.repository";
import { GamePublicService } from "./game-public/game.service";

@Module({
    imports: [TypeOrmModule.forFeature([Game, Player, Questions, Answers, GameQuestions]), UsersModule],
    controllers: [GameAdminController, GamePublicController],
    providers: [GamePublicService, GameRepository, GameAdminService, GameAdminRepository],
    exports: [GamePublicService, GameRepository, GameAdminService, GameAdminRepository],
})
export class GameQuizModule {}