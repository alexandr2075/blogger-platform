import { User } from "@/modules/users/domain/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AnswerDto, PlayerDto, PlayerProgressDto } from "../dto/game.view-dto";
import { Answers } from "./answers.entity";

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
        const dto: PlayerProgressDto = {
            player: {
                id: this.user?.id || this.userId,
                login: this.user?.login || 'Unknown'
            } as PlayerDto,
            score: this.score,
            answers: this.answers?.sort((a, b) => a.date.getTime() - b.date.getTime()).map(answer => ({
                questionId: answer.question_id,
                answerStatus: answer.status as 'Correct' | 'Incorrect',
                addedAt: answer.date.toISOString()
            } as AnswerDto)) || [],
        };

        return dto;
    }
}