import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Game } from "./game.entity";
import { Questions } from "./questions.entity";

@Entity('game-questions')
export class GameQuestions {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Game)
    game: Game;
    @Column({ type: 'uuid' })
    gameId: string;

    @ManyToOne(() => Questions)
    question: Questions;
    @Column({ type: 'uuid' })
    questionId: string;

    @Column({ type: 'int' })
    position: number;
}
