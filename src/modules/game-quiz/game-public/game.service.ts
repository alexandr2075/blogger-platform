import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from "@nestjs/common";
import { GameRepository } from "./game.repository";
import { Game, Status } from "../domain/game.entity";
import { Answers } from "../domain/answers.entity";

@Injectable()
export class GamePublicService {
    constructor(
        private readonly gameRepository: GameRepository,
    ) {}            

    async connection(userId: string) {
        // Check if user is already participating in an active game
        const existingUserGame = await this.gameRepository.findActiveGameByUserId(userId);
        if (existingUserGame) {
            throw new ForbiddenException('Current user is already participating in active pair');
        }

        const game = await this.gameRepository.findGameWithFirstPlayer();
        if (!game) {
            const player1 = await this.gameRepository.createPlayer(userId);
            const questions = await this.gameRepository.getRandomQuestions();
            
            const newGame = new Game();
            newGame.firstPlayer = player1;
            newGame.secondPlayer = null;
            newGame.status = Status.PendingSecondPlayer;
            newGame.questions = questions;
            
            const createdGame = await this.gameRepository.createGame(newGame);
            return createdGame.mapToViewDto();
        }

        return game.mapToViewDto();
    }

    async getCurrentPair(userId: string) {
        const game = await this.gameRepository.findActiveGameByUserId(userId);
        if (!game) {
            throw new NotFoundException('No active pair for current user');
        }
        return game.mapToViewDto();
    }

    async getPairById(id: string, userId: string) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            throw new BadRequestException([{
                message: 'Invalid id format',
                field: 'id'
            }]);
        }

        const game = await this.gameRepository.findGameById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // Check if current user is a participant in this game
        const isParticipant = game.firstPlayer?.userId === userId || game.secondPlayer?.userId === userId;
        if (!isParticipant) {
            throw new ForbiddenException('Current user tries to get pair in which user is not participant');
        }

        return game.mapToViewDto();
    }

    async submitAnswer(answer: string, userId: string) {
        // Find the user's active game
        const game = await this.gameRepository.findActiveGameByUserId(userId);
        if (!game) {
            throw new ForbiddenException('Current user is not inside active pair');
        }

        // Find the player
        const player = await this.gameRepository.findPlayerByUserId(userId);
        if (!player) {
            throw new ForbiddenException('Player not found');
        }

        // Find the next unanswered question for this player
        const nextQuestion = await this.gameRepository.findNextUnansweredQuestion(game.id, player.id);
        if (!nextQuestion) {
            throw new ForbiddenException('User is in active pair but has already answered to all questions');
        }

        // Check if the answer is correct
        const isCorrect = nextQuestion.correctAnswers.includes(answer);
        const answerStatus = isCorrect ? 'Correct' : 'Incorrect';

        // Create and save the answer
        const answerEntity = new Answers();
        answerEntity.player_id = player.id;
        answerEntity.question_id = nextQuestion.id;
        answerEntity.status = isCorrect ? 'Correct' as any : 'Incorrect' as any;
        answerEntity.date = new Date();

        const savedAnswer = await this.gameRepository.saveAnswer(answerEntity);

        // Update player score if correct
        if (isCorrect) {
            player.score += 1;
            await this.gameRepository.updatePlayer(player);
        }

        return {
            questionId: nextQuestion.id,
            answerStatus: answerStatus,
            addedAt: savedAnswer.date.toISOString()
        };
    }
}