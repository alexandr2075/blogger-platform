import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Game } from "./game.entity";
import { QuestionDto } from "../dto/game.view-dto";

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

    @Column({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => Game, (game) => game.questions)
    game: Game;

    mapToViewDto(): QuestionDto {
        return {
            id: this.id,
            body: this.body
        };
    }
}
