import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Game, Status } from "../domain/game.entity";
import { UsersQueryRepository } from "../../users/infrastructure/users.query-repository";
import { Player } from "../domain/player.entity";
import { Questions } from "../domain/questions.entity";
import { Answers } from "../domain/answers.entity";

@Injectable()
export class GameRepository {
    constructor(
        @InjectRepository(Game)
        private readonly gameRepository: Repository<Game>,
        @InjectRepository(Player)
        private readonly playerRepository: Repository<Player>,
        @InjectRepository(Questions)
        private readonly questionsRepository: Repository<Questions>,
        @InjectRepository(Answers)
        private readonly answersRepository: Repository<Answers>,
        private usersQueryRepository: UsersQueryRepository,
    ) {}

    async createGame(game: Game): Promise<Game> {
        return this.gameRepository.save(game);
    }

    async createPlayer(userId: string): Promise<Player> {
        const user = await this.usersQueryRepository.getOneById(userId);
        const player = new Player();
        player.userId = user.id;
        return this.playerRepository.save(player);
    }

    async findGameWithFirstPlayer(): Promise<Game | null> {
        return this.gameRepository.findOne({
            where: {
                secondPlayer: IsNull(),
                status: Status.PendingSecondPlayer,
            },
            relations: ['firstPlayer', 'firstPlayer.user', 'questions']
        });
    }

    async getRandomQuestions(): Promise<Questions[]> {
        return this.questionsRepository
            .createQueryBuilder('questions')
            .where('questions.published = :published', { published: true })
            .orderBy('RANDOM()')
            .limit(5)
            .getMany();
    }

    async findActiveGameByUserId(userId: string): Promise<Game | null> {
        return this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('game.questions', 'questions')
            .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', { userId })
            .andWhere('game.status != :finishedStatus', { finishedStatus: Status.Finished })
            .getOne();
    }

    async findGameById(id: string): Promise<Game | null> {
        return this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('game.questions', 'questions')
            .where('game.id = :id', { id })
            .getOne();
    }

    async findPlayerByUserId(userId: string): Promise<Player | null> {
        return this.playerRepository
            .createQueryBuilder('player')
            .leftJoinAndSelect('player.answers', 'answers')
            .leftJoinAndSelect('player.user', 'user')
            .where('player.userId = :userId', { userId })
            .getOne();
    }

    async findNextUnansweredQuestion(gameId: string, playerId: string): Promise<Questions | null> {
        return this.questionsRepository
            .createQueryBuilder('question')
            .where('question.gameId = :gameId', { gameId })
            .andWhere('question.id NOT IN (SELECT answer.question_id FROM answers answer WHERE answer.player_id = :playerId)', { playerId })
            .orderBy('question.createdAt', 'ASC')
            .getOne();
    }

    async saveAnswer(answer: Answers): Promise<Answers> {
        return this.answersRepository.save(answer);
    }

    async updatePlayer(player: Player): Promise<Player> {
        return this.playerRepository.save(player);
    }
}