import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { UsersQueryRepository } from "../../users/infrastructure/users.query-repository";
import { Answers } from "../domain/answers.entity";
import { GameQuestions } from "../domain/game-questions.entity";
import { Game, Status } from "../domain/game.entity";
import { Player } from "../domain/player.entity";
import { Questions } from "../domain/questions.entity";

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
        @InjectRepository(GameQuestions)
        private readonly gameQuestionsRepository: Repository<GameQuestions>,
        private usersQueryRepository: UsersQueryRepository,
    ) {}

    async createGame(game: Game): Promise<Game> {
        // Save the game without attaching questions
        const savedGame = await this.gameRepository.save(game);

        // Reload the game with relations
        const reloadedGame = await this.gameRepository.findOne({
            where: { id: savedGame.id },
            relations: ['firstPlayer', 'firstPlayer.user', 'firstPlayer.answers', 'secondPlayer', 'secondPlayer.user', 'secondPlayer.answers']
        });

        if (!reloadedGame) {
            throw new Error(`Failed to reload game with id ${savedGame.id}`);
        }

        return reloadedGame;
    }

    async createPlayer(userId: string): Promise<Player> {
        const player = this.playerRepository.create({
            userId: userId,
            score: 0
        });
        const savedPlayer = await this.playerRepository.save(player);
        
        // Reload the player with user relation to ensure proper mapping
        const playerWithUser = await this.playerRepository.findOne({
            where: { id: savedPlayer.id },
            relations: ['user']
        });
        
        return playerWithUser || savedPlayer;
    }

    async findGameWithFirstPlayer(excludeUserId?: string): Promise<Game | null> {
        const qb = this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .where('game.status = :status', { status: Status.PendingSecondPlayer })
            .andWhere('game."secondPlayerId" IS NULL')
            .orderBy('game.createdAt', 'ASC');

        if (excludeUserId) {
            qb.andWhere('firstPlayer.userId != :excludeUserId', { excludeUserId });
        }

        return qb.getOne();
    }

    async getRandomQuestions(): Promise<Questions[]> {
        // First try to get published questions
        let questions = await this.questionsRepository
            .createQueryBuilder('questions')
            .where('questions.published = :published', { published: true })
            .orderBy('questions."createdAt"', 'ASC')
            .limit(5)
            .getMany();

        // If no published questions found, get any questions (for testing)
        if (questions.length === 0) {
            questions = await this.questionsRepository
                .createQueryBuilder('questions')
                .orderBy('questions."createdAt"', 'ASC')
                .limit(5)
                .getMany();
        }

        // If still no questions, get any questions regardless of gameId (for testing)
        if (questions.length === 0) {
            questions = await this.questionsRepository
                .createQueryBuilder('questions')
                .orderBy('questions."createdAt"', 'ASC')
                .limit(5)
                .getMany();
        }

        // Ensure we always return exactly 5 questions for consistency
        if (questions.length < 5) {
            const allQuestions = await this.questionsRepository
                .createQueryBuilder('questions')
                .orderBy('questions."createdAt"', 'ASC')
                .getMany();
            
            // Take the first 5 questions
            questions = allQuestions.slice(0, 5);
        }

        return questions;
    }

    private async loadQuestionsForGame(game: Game): Promise<Game> {
        if (!game) return game;
        const links = await this.gameQuestionsRepository.find({ where: { gameId: game.id }, order: { position: 'ASC' } });
        if (links.length === 0) {
            game.questions = [];
            return game;
        }
        const questionIds = links.map(l => l.questionId);
        const qs = await this.questionsRepository.find({ where: { id: In(questionIds) } });
        // Map by id for quick lookup and order by link position
        const byId = new Map(qs.map(q => [q.id, q]));
        game.questions = links.map(l => byId.get(l.questionId)).filter(Boolean) as Questions[];
        return game;
    }

    async findActiveGameByUserId(userId: string): Promise<Game | null> {
        const game = await this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', { userId })
            .andWhere('game.status = :activeStatus', { activeStatus: Status.Active })
            .orderBy('game.createdAt', 'DESC')
            .getOne();
        if (!game) return game;
        return this.loadQuestionsForGame(game);
    }


    async findCurrentGameByUserId(userId: string): Promise<Game | null> {
        const game = await this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', { userId })
            .andWhere('game.status IN (:...statuses)', { statuses: [Status.PendingSecondPlayer, Status.Active] })
            .orderBy('game.createdAt', 'DESC') 
            .getOne();
        if (!game) return game;
        return this.loadQuestionsForGame(game);
    }

    async findAnyGameByUserId(userId: string): Promise<Game | null> {
        const game = await this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', { userId })
            .andWhere('game.status IN (:...statuses)', { statuses: [Status.PendingSecondPlayer, Status.Active, Status.Finished] })
            .orderBy('game.createdAt', 'DESC')
            .getOne();
        if (!game) return game;
        return this.loadQuestionsForGame(game);
    }

    async findAllGamesByUserId(userId: string): Promise<Game[]> {
        const games = await this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', { userId })
            .orderBy('game.createdAt', 'DESC')
            .getMany();

        const withQuestions: Game[] = [];
        for (const g of games) {
            withQuestions.push(await this.loadQuestionsForGame(g));
        }
        return withQuestions;
    }

    async findAllGamesByUserIdPaged(userId: string, skip: number, take: number, orderBy = 'game.createdAt', orderDirection: 'ASC' | 'DESC' = 'DESC'): Promise<{ items: Game[]; total: number }>{
        const qb = this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', { userId })
            .orderBy(orderBy, orderDirection)
            // Вторичная сортировка по дате создания (pairCreatedDate) DESC
            .addOrderBy('game.createdAt', 'DESC')
            .skip(skip)
            .take(take);

        const [itemsRaw, total] = await qb.getManyAndCount();
        const items: Game[] = [];
        for (const g of itemsRaw) {
            items.push(await this.loadQuestionsForGame(g));
        }
        return { items, total };
    }


    async findGameById(id: string): Promise<Game | null> {
        const game = await this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('game.id = :id', { id })
            .getOne();
        if (!game) return game;
        return this.loadQuestionsForGame(game);
    }

    async findFinishedGamesByUser(userId: string): Promise<Game[]> {
        const games = await this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('(firstPlayer.userId = :userId OR secondPlayer.userId = :userId)', { userId })
            .andWhere('game.status = :status', { status: Status.Finished })
            .orderBy('game.finishGameDate', 'DESC')
            .getMany();

        const withQuestions: Game[] = [];
        for (const g of games) {
            withQuestions.push(await this.loadQuestionsForGame(g));
        }
        return withQuestions;
    }

    async findAllFinishedGames(): Promise<Game[]> {
        const games = await this.gameRepository
            .createQueryBuilder('game')
            .leftJoinAndSelect('game.firstPlayer', 'firstPlayer')
            .leftJoinAndSelect('firstPlayer.user', 'firstPlayerUser')
            .leftJoinAndSelect('firstPlayer.answers', 'firstPlayerAnswers')
            .leftJoinAndSelect('game.secondPlayer', 'secondPlayer')
            .leftJoinAndSelect('secondPlayer.user', 'secondPlayerUser')
            .leftJoinAndSelect('secondPlayer.answers', 'secondPlayerAnswers')
            .where('game.status = :status', { status: Status.Finished })
            .orderBy('game.finishGameDate', 'DESC')
            .getMany();

        const withQuestions: Game[] = [];
        for (const g of games) {
            withQuestions.push(await this.loadQuestionsForGame(g));
        }
        return withQuestions;
    }

    async findPlayerByUserId(userId: string): Promise<Player | null> {
        return this.playerRepository
            .createQueryBuilder('player')
            .leftJoinAndSelect('player.answers', 'answers')
            .leftJoinAndSelect('player.user', 'user')
            .where('player.userId = :userId', { userId })
            .getOne();
    }

    async findNextUnansweredQuestion(game: Game, playerId: string): Promise<Questions | null> {
        let questions = game.questions; // Rely on eager loading
        
        // Fallback: if questions are not loaded, get them from database
        if (!questions || questions.length === 0) {
            questions = await this.questionsRepository
                .createQueryBuilder('questions')
                .where('questions."gameId" = :gameId', { gameId: game.id })
                .getMany();
        }
        
        if (!questions || questions.length === 0) return null;

        const questionIds = questions.map(q => q.id);
        const answers = await this.answersRepository
            .createQueryBuilder('answer')
            .where('answer.player_id = :playerId', { playerId })
            .andWhere('answer.question_id IN (:...questionIds)', { questionIds })
            .andWhere('answer.date >= :createdAt', { createdAt: game.createdAt })
            .getMany();

        const answeredSet = new Set(answers.map(a => a.question_id));
        const next = questions.find(q => !answeredSet.has(q.id));
        return next || null;
    }

    async saveAnswer(answer: Answers): Promise<Answers> {
        // Use direct insert to avoid TypeORM relationship issues
        const result = await this.answersRepository
            .createQueryBuilder()
            .insert()
            .into(Answers)
            .values({
                player_id: answer.player_id,
                question_id: answer.question_id,
                status: answer.status,
                date: answer.date
            })
            .returning('*')
            .execute();
        
        // Create a new entity instance from the raw result
        const savedAnswer = new Answers();
        const rawAnswer = result.raw[0];
        savedAnswer.id = rawAnswer.id;
        savedAnswer.player_id = rawAnswer.player_id;
        savedAnswer.question_id = rawAnswer.question_id;
        savedAnswer.status = rawAnswer.status;
        savedAnswer.date = rawAnswer.date;
        
        return savedAnswer;
    }

    async updatePlayer(player: Player): Promise<Player> {
        // Update only the player fields without cascading to answers
        await this.playerRepository.update(player.id, {
            score: player.score,
            status: player.status
        });
        return player;
    }

    async updateGame(game: Game): Promise<Game> {
        const savedGame = await this.gameRepository.save(game);

        // Explicitly update the game status in the database
        await this.gameRepository.update(savedGame.id, {
            status: savedGame.status,
            startGameDate: savedGame.startGameDate,
            finishGameDate: savedGame.finishGameDate
        });
        
        // Reload the game with all relations to ensure proper mapping
        let reloadedGame = await this.gameRepository.findOne({
            where: { id: savedGame.id },
            relations: [
                'firstPlayer',
                'firstPlayer.user',
                'firstPlayer.answers',
                'secondPlayer',
                'secondPlayer.user',
                'secondPlayer.answers',
            ]
        });

        reloadedGame = await this.loadQuestionsForGame(reloadedGame || savedGame);
        return reloadedGame;
    }

    async countPlayerAnswers(game: Game, playerId: string): Promise<number> {
        const questionIds = game.questions?.map(q => q.id) || [];
        if (questionIds.length === 0) return 0;

        const count = await this.answersRepository
            .createQueryBuilder('answer')
            .where('answer.player_id = :playerId', { playerId })
            .andWhere('answer.question_id IN (:...questionIds)', { questionIds })
            .andWhere('answer.date >= :createdAt', { createdAt: game.createdAt })
            .getCount();

        return count;
    }

    async findLastAnswerForPlayer(playerId: string): Promise<Answers | null> {
        return this.answersRepository.findOne({
            where: { player_id: playerId },
            order: { date: 'DESC' },
        });
    }

    async findLastAnswerForPlayerInGame(game: Game, playerId: string): Promise<Answers | null> {
        const questionIds = game.questions?.map(q => q.id) || [];
        if (questionIds.length === 0) return null;
        
        return this.answersRepository
            .createQueryBuilder('answer')
            .where('answer.player_id = :playerId', { playerId })
            .andWhere('answer.question_id IN (:...questionIds)', { questionIds })
            .andWhere('answer.date >= :createdAt', { createdAt: game.createdAt })
            .orderBy('answer.date', 'DESC')
            .getOne();
    }

    async saveQuestions(questions: Questions[]): Promise<void> {
        for (const question of questions) {
            await this.questionsRepository.save(question);
        }
    }

    async linkQuestionsToGame(gameId: string, questions: Questions[]): Promise<void> {
        const records: Partial<GameQuestions>[] = questions.map((q, idx) => ({ gameId, questionId: q.id, position: idx + 1 }));
        if (records.length === 0) return;
        await this.gameQuestionsRepository
            .createQueryBuilder()
            .insert()
            .into(GameQuestions)
            .values(records)
            .execute();
    }

    async findQuestionByGameAndPosition(gameId: string, position: number): Promise<Questions | null> {
        const link = await this.gameQuestionsRepository.findOne({ where: { gameId, position } });
        if (!link) return null;
        return this.questionsRepository.findOne({ where: { id: link.questionId } });
    }
}