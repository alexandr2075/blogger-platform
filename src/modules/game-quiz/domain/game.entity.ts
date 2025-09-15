import { Entity, OneToOne, PrimaryGeneratedColumn, Column, JoinColumn, OneToMany } from "typeorm";
import { Player } from "./player.entity";
import { Questions } from "./questions.entity";
import { GameViewDto } from "../dto/game.view-dto";

export enum Status {
    PendingSecondPlayer = 'PendingSecondPlayer',
    Active = 'Active',
    Finished = 'Finished'
}

@Entity('game')
export class Game {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Player)
    @JoinColumn()
    firstPlayer: Player;

    @OneToOne(() => Player)
    @JoinColumn()
    secondPlayer: Player | null;

    @Column({ type: 'enum', enum: Status, default: Status.PendingSecondPlayer })
    status: Status.PendingSecondPlayer | Status.Active | Status.Finished;

    @OneToMany(() => Questions, (question) => question.game)
    questions: Questions[];

    @Column({ name: 'createdAt', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'startGameDate', type: 'timestamp with time zone', nullable: true })
    startGameDate: Date | null;

    @Column({ name: 'finishGameDate', type: 'timestamp with time zone', nullable: true })
    finishGameDate: Date | null;

    mapToViewDto(): GameViewDto {   
        return {
            id: this.id,
            firstPlayerProgress: this.firstPlayer?.mapToViewDto() || null,
            secondPlayerProgress: this.secondPlayer?.mapToViewDto() || null,
            questions: this.questions?.map((question) => question.mapToViewDto()) || [],
            status: this.status,
            pairCreatedDate: this.createdAt.toISOString(),
            startGameDate: this.startGameDate?.toISOString() || null,
            finishGameDate: this.finishGameDate?.toISOString() || null,
        };
    }
}
