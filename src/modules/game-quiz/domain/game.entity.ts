import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { GameViewDto } from "../dto/game.view-dto";
import { Player } from "./player.entity";
import { Questions } from "./questions.entity";

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
        const questionIds = (this.questions || []).map(q => q.id);

        // Temporarily filter answers to only those that belong to this game
        // Only filter if we have questions to filter by
        const originalFirstAnswers = this.firstPlayer?.answers || [];
        const originalSecondAnswers = this.secondPlayer?.answers || [];

        if (this.firstPlayer && questionIds.length > 0) {
            this.firstPlayer.answers = originalFirstAnswers.filter(a => questionIds.includes(a.question_id));
        }
        if (this.secondPlayer && questionIds.length > 0) {
            this.secondPlayer.answers = originalSecondAnswers.filter(a => questionIds.includes(a.question_id));
        }

        const view: GameViewDto = {
            id: this.id,
            firstPlayerProgress: this.firstPlayer?.mapToViewDto() || null,
            secondPlayerProgress: this.secondPlayer?.mapToViewDto() || null,
            questions: this.status === Status.PendingSecondPlayer ? null : (this.questions?.map((question) => question.mapToViewDto()) || []),
            status: this.status,
            pairCreatedDate: this.createdAt.toISOString(),
            startGameDate: this.startGameDate?.toISOString() || null,
            finishGameDate: this.finishGameDate?.toISOString() || null,
        };

        // Restore original answers
        if (this.firstPlayer) {
            this.firstPlayer.answers = originalFirstAnswers;
        }
        if (this.secondPlayer) {
            this.secondPlayer.answers = originalSecondAnswers;
        }

        return view;
    }
}
