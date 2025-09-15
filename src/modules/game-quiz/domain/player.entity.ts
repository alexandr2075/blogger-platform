import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Column, JoinColumn } from "typeorm";
import { Answers } from "./answers.entity";
import { User } from "@/modules/users/domain/user.entity";
import { PlayerProgressDto, AnswerDto, PlayerDto } from "../dto/game.view-dto";

enum Status {
    WIN = 'Win',
    LOSE = 'Lose',
    DRAW = 'Draw'
}

@Entity('player')
export class Player {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'int', default: 0 })
    score: number;

    @OneToMany(() => Answers, (answers) => answers.player)
    answers: Answers[];

    @Column({ type: 'enum', enum: Status, nullable: true })
    status: Status.WIN | Status.LOSE | Status.DRAW;

    mapToViewDto(): PlayerProgressDto {
        return {
            player: {
                id: this.user?.id || this.userId,
                login: this.user?.login || 'Unknown'
            } as PlayerDto,
            score: this.score,
            answers: this.answers?.map(answer => ({
                questionId: answer.question_id,
                answerStatus: answer.status as 'Correct' | 'Incorrect',
                addedAt: answer.date.toISOString()
            } as AnswerDto)) || []
        };
    }
}