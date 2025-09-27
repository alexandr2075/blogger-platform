import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { QuestionDto } from "../dto/game.view-dto";
import { Game } from "./game.entity";

@Entity('questions')
export class Questions {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    body: string;

    @Column({ type: 'text', array: true })
    correctAnswers: string[];

    @Column({ type: 'boolean' })
    published: boolean;

    @Column({ type: 'timestamp' })
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true, default: null })
    updatedAt: Date;

    @Column({ name: 'gameId', nullable: true })
    gameId: string;

    @ManyToOne(() => Game, (game) => game.questions)
    game: Game;

    mapToViewDto(): QuestionDto {
        return {
            id: this.id,
            body: this.body
        };
    }
}
