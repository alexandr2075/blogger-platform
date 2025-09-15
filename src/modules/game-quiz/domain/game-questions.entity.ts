import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Game } from "./game.entity";
import { Questions } from "./questions.entity";

@Entity('game-questions')
export class GameQuestions {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Game)
    game: Game;
    gameId: string;

    @ManyToOne(() => Questions)
    question: Questions;
    questionId: string;
}
