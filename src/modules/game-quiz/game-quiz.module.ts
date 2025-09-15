import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Game } from "./domain/game.entity";
import { Player } from "./domain/player.entity";
import { Questions } from "./domain/questions.entity";

import { Answers } from "./domain/answers.entity";
import { GamePublicService } from "./game-public/game.service";
import { GameRepository } from "./game-public/game.repository";
import { UsersModule } from "../users/users.module";
import { GameAdminController } from "./game-admin/game-admin.controller";
import { GameAdminService } from "./game-admin/game-admin.service";
import { GameAdminRepository } from "./game-admin/game-admin.repository";
import { GamePublicController } from "./game-public/game.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Game, Player, Questions, Answers]), UsersModule],
    controllers: [GameAdminController, GamePublicController],
    providers: [GamePublicService, GameRepository, GameAdminService, GameAdminRepository],
    exports: [GamePublicService, GameRepository, GameAdminService, GameAdminRepository],
})
export class GameQuizModule {}