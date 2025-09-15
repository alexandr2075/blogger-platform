import { Entity, ManyToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { Player } from "./player.entity";

enum Status {
    CORRECT = 'Correct',
    INCORRECT = 'Incorrect'
}

@Entity('answers')
export class Answers {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Player, (player) => player.answers)
    player: Player;

    @Column({ type: 'uuid' })
    player_id: string;

    @Column({ type: 'uuid' })
    question_id: string;

    @Column({ type: 'enum', enum: Status })
    status: Status.CORRECT | Status.INCORRECT;

    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    date: Date;
}