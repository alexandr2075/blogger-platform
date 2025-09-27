import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Answers } from '../domain/answers.entity';
import { Game, Status } from "../domain/game.entity";
import { GameRepository } from './game.repository';

@Injectable()
export class GamePublicService {
    constructor(
        private readonly gameRepository: GameRepository,
    ) {}            

    async connection(userId: string) {
        // Check if user is already participating in any active game (not finished)
        const existingGame = await this.gameRepository.findCurrentGameByUserId(userId);
        if (existingGame) {
            throw new ForbiddenException('Current user is already participating in active pair');
        }

        const game = await this.gameRepository.findGameWithFirstPlayer(userId);

        if (game && game.firstPlayer.userId === userId) {
            throw new ForbiddenException('Current user is already participating in active pair');
        }

        if (!game) {
            // Create new game with first player
            const player1 = await this.gameRepository.createPlayer(userId);
            
            const newGame = new Game();
            newGame.firstPlayer = player1;
            newGame.secondPlayer = null;
            newGame.status = Status.PendingSecondPlayer;
            
            // Assign questions via game-questions link table
            const selected = await this.gameRepository.getRandomQuestions();
            newGame.questions = selected;
            
            const createdGame = await this.gameRepository.createGame(newGame);
            
            // Link selected questions to this game
            await this.gameRepository.linkQuestionsToGame(createdGame.id, selected);
            // Reload with linked questions
            const reloaded = await this.gameRepository.findGameById(createdGame.id);
            if (reloaded) return reloaded.mapToViewDto();
            
            return createdGame.mapToViewDto();
        }

        // Join existing game as second player
        const player2 = await this.gameRepository.createPlayer(userId);
        game.secondPlayer = player2;
        game.status = Status.Active;
        game.startGameDate = new Date();
        
        // Use the same questions that were already assigned to the game
        // Don't load new questions, just update the game status
        
        const updatedGame = await this.gameRepository.updateGame(game);
        // Ensure questions are present in the response for started games
        // The above lines ensure updatedGame already has the questions.
        // if (updatedGame.status !== Status.PendingSecondPlayer && (!updatedGame.questions || updatedGame.questions.length === 0)) {
        //     updatedGame.questions = await this.gameRepository.getRandomQuestions();
        // }
        return updatedGame.mapToViewDto();
    }

    async getCurrentPair(userId: string) {
        let game = await this.gameRepository.findCurrentGameByUserId(userId);
        
        if (!game) {
            throw new NotFoundException('No active pair for current user');
        }
        // Таймаут: если один игрок уже завершил (5 ответов), а второй нет, даем 10 секунд на догонку
        const firstAnswers = await this.gameRepository.countPlayerAnswers(game, game.firstPlayer.id);
        const secondAnswers = game.secondPlayer ? await this.gameRepository.countPlayerAnswers(game, game.secondPlayer.id) : 0;
        const someoneFinished = firstAnswers >= 5 || secondAnswers >= 5;
        const bothFinished = firstAnswers >= 5 && secondAnswers >= 5;

        if (!bothFinished && someoneFinished && game.status === Status.Active) {
            // Определяем, кто завершил первым и когда
            const finisherIsFirst = firstAnswers >= 5;
            const finisherId = finisherIsFirst ? game.firstPlayer.id : (game.secondPlayer?.id as string);
            const finisherLast = await this.gameRepository.findLastAnswerForPlayerInGame(game, finisherId);
            if (finisherLast) {
                const deadline = new Date(finisherLast.date.getTime() + 10_000);
                if (new Date() >= deadline) {
                    // Автозаполним оставшиеся ответы для отстающего как Incorrect
                    const lagger = finisherIsFirst ? (game.secondPlayer!) : game.firstPlayer;
                    const laggerAnswers = finisherIsFirst ? secondAnswers : firstAnswers;
                    for (let pos = laggerAnswers + 1; pos <= 5; pos++) {
                        const q = await this.gameRepository.findQuestionByGameAndPosition(game.id, pos);
                        if (!q) continue;
                        await this.gameRepository.saveAnswer({
                            id: undefined as any,
                            player: undefined as any,
                            player_id: lagger.id,
                            question_id: q.id,
                            status: 'Incorrect' as any,
                            date: new Date()
                        } as Answers);
                    }

                    // Пересчитаем очки и завершим игру с учетом бонуса скорости
                    const updatedFirstCount = await this.gameRepository.countPlayerAnswers(game, game.firstPlayer.id);
                    const updatedSecondCount = game.secondPlayer ? await this.gameRepository.countPlayerAnswers(game, game.secondPlayer.id) : 0;
                    if (updatedFirstCount >= 5 && updatedSecondCount >= 5) {
                        // Бонус скорости
                        const firstPlayerLastAnswer = await this.gameRepository.findLastAnswerForPlayerInGame(game, game.firstPlayer.id);
                        const secondPlayerLastAnswer = game.secondPlayer ? await this.gameRepository.findLastAnswerForPlayerInGame(game, game.secondPlayer.id) : null;

                        let firstPlayerFinishedFirst = false;
                        let secondPlayerFinishedFirst = false;
                        if (firstPlayerLastAnswer && secondPlayerLastAnswer) {
                            if (firstPlayerLastAnswer.date < secondPlayerLastAnswer.date) firstPlayerFinishedFirst = true;
                            else if (secondPlayerLastAnswer.date < firstPlayerLastAnswer.date) secondPlayerFinishedFirst = true;
                        }

                        const firstScore = game.firstPlayer.score;
                        const secondScore = game.secondPlayer?.score || 0;
                        let finalFirstScore = firstScore;
                        let finalSecondScore = secondScore;
                        if (firstPlayerFinishedFirst && firstScore > 0) {
                            finalFirstScore += 1; game.firstPlayer.score = finalFirstScore; await this.gameRepository.updatePlayer(game.firstPlayer);
                        }
                        if (secondPlayerFinishedFirst && secondScore > 0) {
                            finalSecondScore += 1; if (game.secondPlayer) { game.secondPlayer.score = finalSecondScore; await this.gameRepository.updatePlayer(game.secondPlayer); }
                        }

                        if (finalFirstScore > finalSecondScore) {
                            game.firstPlayer.status = 'Win' as any; if (game.secondPlayer) game.secondPlayer.status = 'Lose' as any;
                        } else if (finalSecondScore > finalFirstScore) {
                            if (game.secondPlayer) game.secondPlayer.status = 'Win' as any; game.firstPlayer.status = 'Lose' as any;
                        } else {
                            game.firstPlayer.status = 'Draw' as any; if (game.secondPlayer) game.secondPlayer.status = 'Draw' as any;
                        }

                        game.status = Status.Finished;
                        game.finishGameDate = new Date();
                        await this.gameRepository.updatePlayer(game.firstPlayer);
                        if (game.secondPlayer) await this.gameRepository.updatePlayer(game.secondPlayer);
                        await this.gameRepository.updateGame(game);
                        const reloaded = await this.gameRepository.findGameById(game.id);
                        if (reloaded) game = reloaded;
                    }
                }
            }
        }

        // Если игра уже не активна (могла завершиться по таймауту выше) — 404 как "нет активной пары"
        if (game.status !== Status.Active) {
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

        let game = await this.gameRepository.findGameById(id);
        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // Check if current user is a participant in this game
        const isParticipant = game.firstPlayer?.userId === userId || game.secondPlayer?.userId === userId;
        if (!isParticipant) {
            throw new ForbiddenException('Current user tries to get pair in which user is not participant');
        }

        // Таймаут-логика как в getCurrentPair: если один игрок завершил 5, второй не успел за 10с — автозавершение
        if (game.status === Status.Active && game.firstPlayer && game.secondPlayer) {
            const firstAnswers = await this.gameRepository.countPlayerAnswers(game, game.firstPlayer.id);
            const secondAnswers = await this.gameRepository.countPlayerAnswers(game, game.secondPlayer.id);
            const bothFinished = firstAnswers >= 5 && secondAnswers >= 5;
            const someoneFinished = firstAnswers >= 5 || secondAnswers >= 5;
            if (!bothFinished && someoneFinished) {
                const finisherIsFirst = firstAnswers >= 5;
                const finisherId = finisherIsFirst ? game.firstPlayer.id : game.secondPlayer.id;
                const finisherLast = await this.gameRepository.findLastAnswerForPlayerInGame(game, finisherId);
                if (finisherLast) {
                    const deadline = new Date(finisherLast.date.getTime() + 10_000);
                    if (new Date() >= deadline) {
                        const lagger = finisherIsFirst ? game.secondPlayer : game.firstPlayer;
                        const laggerAnswers = finisherIsFirst ? secondAnswers : firstAnswers;
                        for (let pos = laggerAnswers + 1; pos <= 5; pos++) {
                            const q = await this.gameRepository.findQuestionByGameAndPosition(game.id, pos);
                            if (!q) continue;
                            await this.gameRepository.saveAnswer({
                                id: undefined as any,
                                player: undefined as any,
                                player_id: lagger.id,
                                question_id: q.id,
                                status: 'Incorrect' as any,
                                date: new Date()
                            } as Answers);
                        }

                        // Подсчёт, бонус скорости и завершение
                        const firstPlayerLastAnswer = await this.gameRepository.findLastAnswerForPlayerInGame(game, game.firstPlayer.id);
                        const secondPlayerLastAnswer = await this.gameRepository.findLastAnswerForPlayerInGame(game, game.secondPlayer.id);
                        let firstPlayerFinishedFirst = false;
                        let secondPlayerFinishedFirst = false;
                        if (firstPlayerLastAnswer && secondPlayerLastAnswer) {
                            if (firstPlayerLastAnswer.date < secondPlayerLastAnswer.date) firstPlayerFinishedFirst = true;
                            else if (secondPlayerLastAnswer.date < firstPlayerLastAnswer.date) secondPlayerFinishedFirst = true;
                        }
                        const firstScore = game.firstPlayer.score;
                        const secondScore = game.secondPlayer.score;
                        let finalFirstScore = firstScore;
                        let finalSecondScore = secondScore;
                        if (firstPlayerFinishedFirst && firstScore > 0) { finalFirstScore += 1; game.firstPlayer.score = finalFirstScore; await this.gameRepository.updatePlayer(game.firstPlayer); }
                        if (secondPlayerFinishedFirst && secondScore > 0) { finalSecondScore += 1; game.secondPlayer.score = finalSecondScore; await this.gameRepository.updatePlayer(game.secondPlayer); }
                        if (finalFirstScore > finalSecondScore) { game.firstPlayer.status = 'Win' as any; game.secondPlayer.status = 'Lose' as any; }
                        else if (finalSecondScore > finalFirstScore) { game.secondPlayer.status = 'Win' as any; game.firstPlayer.status = 'Lose' as any; }
                        else { game.firstPlayer.status = 'Draw' as any; game.secondPlayer.status = 'Draw' as any; }
                        game.status = Status.Finished;
                        game.finishGameDate = new Date();
                        await this.gameRepository.updatePlayer(game.firstPlayer);
                        await this.gameRepository.updatePlayer(game.secondPlayer);
                        await this.gameRepository.updateGame(game);
                        const reloaded = await this.gameRepository.findGameById(game.id);
                        if (reloaded) game = reloaded;
                    }
                }
            }
        }

        return game.mapToViewDto();
    }

    async getMyGames(userId: string, pageNumber = 1, pageSize = 10, sortBy = 'pairCreatedDate', sortDirection: 'asc' | 'desc' = 'desc') {
        const safePage = Math.max(1, Number(pageNumber) || 1);
        const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 10));
        const skip = (safePage - 1) * safePageSize;

        // map sortBy from API to DB column
        const sortColumnMap: Record<string, string> = {
            pairCreatedDate: 'game.createdAt',
            startGameDate: 'game.startGameDate',
            finishGameDate: 'game.finishGameDate',
            status: 'game.status',
        };
        const orderBy = sortColumnMap[sortBy] || 'game.createdAt';
        const orderDirection = (sortDirection === 'asc' ? 'ASC' : 'DESC');

        const { items, total } = await this.gameRepository.findAllGamesByUserIdPaged(userId, skip, safePageSize, orderBy, orderDirection);
        return {
            pagesCount: Math.ceil(total / safePageSize),
            page: safePage,
            pageSize: safePageSize,
            totalCount: total,
            items: items.map(g => g.mapToViewDto()),
        };
    }

    async getMyStatistic(userId: string) {
        const games = await this.gameRepository.findFinishedGamesByUser(userId);
        const isFirst = (g: Game) => g.firstPlayer?.userId === userId;

        let sumScore = 0;
        let winsCount = 0;
        let lossesCount = 0;
        let drawsCount = 0;

        for (const g of games) {
            const me = isFirst(g) ? g.firstPlayer : g.secondPlayer!;
            const opponent = isFirst(g) ? g.secondPlayer! : g.firstPlayer!;
            sumScore += me?.score || 0;
            if (me && opponent) {
                if (me.score > opponent.score) winsCount += 1;
                else if (me.score < opponent.score) lossesCount += 1;
                else drawsCount += 1;
            }
        }

        const gamesCount = games.length;
        const avgScores = gamesCount > 0 ? Number((sumScore / gamesCount).toFixed(2)) : 0;

        return {
            sumScore,
            avgScores,
            gamesCount,
            winsCount,
            lossesCount,
            drawsCount,
        };
    }

    async getUsersTop(sortParams: string[] | undefined, pageNumber = 1, pageSize = 10) {
        const sorts = Array.isArray(sortParams) && sortParams.length > 0 ? sortParams : ['avgScores desc', 'sumScore desc'];

        const games = await this.gameRepository.findAllFinishedGames();

        type Stat = {
            sumScore: number;
            gamesCount: number;
            winsCount: number;
            lossesCount: number;
            drawsCount: number;
        };

        const byUser = new Map<string, Stat & { id: string; login: string }>();

        for (const g of games) {
            if (!g.firstPlayer || !g.secondPlayer) continue;
            const firstId = g.firstPlayer.user?.id || g.firstPlayer.userId;
            const secondId = g.secondPlayer.user?.id || g.secondPlayer.userId;
            const firstLogin = g.firstPlayer.user?.login || 'Unknown';
            const secondLogin = g.secondPlayer.user?.login || 'Unknown';

            const ensure = (id: string, login: string) => {
                if (!byUser.has(id)) byUser.set(id, { id, login, sumScore: 0, gamesCount: 0, winsCount: 0, lossesCount: 0, drawsCount: 0 });
                return byUser.get(id)!;
            };

            const s1 = ensure(firstId, firstLogin);
            const s2 = ensure(secondId, secondLogin);

            s1.sumScore += g.firstPlayer.score || 0;
            s2.sumScore += g.secondPlayer.score || 0;
            s1.gamesCount += 1;
            s2.gamesCount += 1;

            if ((g.firstPlayer.score || 0) > (g.secondPlayer.score || 0)) { s1.winsCount += 1; s2.lossesCount += 1; }
            else if ((g.firstPlayer.score || 0) < (g.secondPlayer.score || 0)) { s2.winsCount += 1; s1.lossesCount += 1; }
            else { s1.drawsCount += 1; s2.drawsCount += 1; }
        }

        const itemsAll = Array.from(byUser.values()).map(s => ({
            sumScore: s.sumScore,
            avgScores: s.gamesCount > 0 ? Number((s.sumScore / s.gamesCount).toFixed(2)) : 0,
            gamesCount: s.gamesCount,
            winsCount: s.winsCount,
            lossesCount: s.lossesCount,
            drawsCount: s.drawsCount,
            player: { id: s.id, login: s.login },
        }));

        const cmp = (a: any, b: any) => {
            for (const raw of sorts) {
                const [fieldRaw, dirRaw] = raw.trim().split(/\s+/);
                const field = fieldRaw as keyof typeof a;
                const dir = (dirRaw || 'desc').toLowerCase() === 'asc' ? 1 : -1;
                if (a[field] < (b as any)[field]) return -1 * dir;
                if (a[field] > (b as any)[field]) return 1 * dir;
            }
            // tie-breaker by login asc
            if (a.player.login < b.player.login) return -1;
            if (a.player.login > b.player.login) return 1;
            return 0;
        };

        itemsAll.sort(cmp);

        const safePage = Math.max(1, Number(pageNumber) || 1);
        const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 10));
        const total = itemsAll.length;
        const start = (safePage - 1) * safePageSize;
        const pageItems = itemsAll.slice(start, start + safePageSize);

        return {
            pagesCount: Math.ceil(total / safePageSize),
            page: safePage,
            pageSize: safePageSize,
            totalCount: total,
            items: pageItems,
        };
    }
    async submitAnswer(answer: string, userId: string): Promise<any> {
        // Find only active game where user participates
        let game = await this.gameRepository.findActiveGameByUserId(userId);
        if (!game) {
            throw new ForbiddenException('Current user is not inside active pair');
        }

        // Ensure game is Active
        if (game.status !== Status.Active) {
            throw new ForbiddenException(`Current user is not inside active pair. Game status: ${game.status}`);
        }

        // Determine current player in this game
        const isFirst = game.firstPlayer?.userId === userId;
        const isSecond = game.secondPlayer?.userId === userId;
        if (!isFirst && !isSecond) {
            throw new ForbiddenException('Current user is not inside active pair');
        }
        const player = isFirst ? game.firstPlayer : game.secondPlayer!;

        // Ensure game has questions assigned
        if (!game.questions || game.questions.length === 0) {
            // Fallback: reload to ensure questions are loaded
            const reloaded = await this.gameRepository.findGameById(game.id);
            if (!reloaded || !reloaded.questions || reloaded.questions.length === 0) {
                throw new ForbiddenException('Game has no questions assigned');
            }
            game = reloaded;
        }

        // Ensure player has not already answered all game questions
        const answersCount = await this.gameRepository.countPlayerAnswers(game, player.id);
        if (answersCount >= 5) {
            throw new ForbiddenException('Current user already answered to all questions');
        }

        // Determine position = number of answers already given by this player + 1
        const nextPosition = answersCount + 1;
        // Get question by game and position
        const nextQuestion = await this.gameRepository.findQuestionByGameAndPosition(game.id, nextPosition);
        if (!nextQuestion) {
            throw new ForbiddenException('Current user already answered to all questions');
        }

        // Check correctness (case-insensitive, trim)
        const normalize = (s: string) => s.trim().toLowerCase();
        const normalizedGiven = normalize(answer || '');
        const isCorrect = (nextQuestion.correctAnswers || []).some(a => normalize(a) === normalizedGiven);

        // Persist answer
        const saved = await this.gameRepository.saveAnswer({
            id: undefined as any,
            player: undefined as any,
            player_id: player.id,
            question_id: nextQuestion.id,
            status: (isCorrect ? 'Correct' : 'Incorrect') as any,
            date: new Date()
        } as Answers);

        // Update player's score if correct
        if (isCorrect) {
            player.score = (player.score || 0) + 1;
            await this.gameRepository.updatePlayer(player);
        }

        // Reload minimal game state if needed
        // Check if both players answered 5 questions -> finish the game
        const firstAnswers = await this.gameRepository.countPlayerAnswers(game, game.firstPlayer.id);
        const secondAnswers = game.secondPlayer ? await this.gameRepository.countPlayerAnswers(game, game.secondPlayer.id) : 0;

        if (firstAnswers >= 5 && secondAnswers >= 5 && game.status !== Status.Finished) {
            // Determine who finished first by looking at timestamps of 5th answers
            const firstPlayerLastAnswer = await this.gameRepository.findLastAnswerForPlayerInGame(game, game.firstPlayer.id);
            const secondPlayerLastAnswer = game.secondPlayer ? await this.gameRepository.findLastAnswerForPlayerInGame(game, game.secondPlayer.id) : null;
            
            let firstPlayerFinishedFirst = false;
            let secondPlayerFinishedFirst = false;
            
            if (firstPlayerLastAnswer && secondPlayerLastAnswer) {
                if (firstPlayerLastAnswer.date < secondPlayerLastAnswer.date) {
                    firstPlayerFinishedFirst = true;
                } else if (secondPlayerLastAnswer.date < firstPlayerLastAnswer.date) {
                    secondPlayerFinishedFirst = true;
                }
                // If timestamps are equal, no speed bonus
            }
            
            // Apply speed bonus: +1 point if finished first AND has at least 1 correct answer
            const firstScore = game.firstPlayer.score;
            const secondScore = game.secondPlayer?.score || 0;
            
            let finalFirstScore = firstScore;
            let finalSecondScore = secondScore;
            
            // Speed bonus logic
            if (firstPlayerFinishedFirst && firstScore > 0) {
                finalFirstScore += 1;
                game.firstPlayer.score = finalFirstScore;
                await this.gameRepository.updatePlayer(game.firstPlayer);
            }
            if (secondPlayerFinishedFirst && secondScore > 0) {
                finalSecondScore += 1;
                if (game.secondPlayer) {
                    game.secondPlayer.score = finalSecondScore;
                    await this.gameRepository.updatePlayer(game.secondPlayer);
                }
            }
            
            // Determine winner/loser/draw based on final scores
            if (finalFirstScore > finalSecondScore) {
                game.firstPlayer.status = 'Win' as any;
                if (game.secondPlayer) game.secondPlayer.status = 'Lose' as any;
            } else if (finalSecondScore > finalFirstScore) {
                if (game.secondPlayer) game.secondPlayer.status = 'Win' as any;
                game.firstPlayer.status = 'Lose' as any;
            } else {
                game.firstPlayer.status = 'Draw' as any;
                if (game.secondPlayer) game.secondPlayer.status = 'Draw' as any;
            }
            
            game.status = Status.Finished;
            game.finishGameDate = new Date();
            
            // Persist player statuses and game status
            await this.gameRepository.updatePlayer(game.firstPlayer);
            if (game.secondPlayer) await this.gameRepository.updatePlayer(game.secondPlayer);
            await this.gameRepository.updateGame(game);
            
            // Reload game to ensure all relations are properly loaded
            const reloadedGame = await this.gameRepository.findGameById(game.id);
            if (reloadedGame) {
                game = reloadedGame;
            }
        }

        // Таймаут: если один игрок уже завершил, второй не успевает за 10 секунд — автозавершение
        if (game.status === Status.Active && (firstAnswers >= 5 || secondAnswers >= 5) && !(firstAnswers >= 5 && secondAnswers >= 5)) {
            const finisherIsFirst = firstAnswers >= 5;
            const finisherId = finisherIsFirst ? game.firstPlayer.id : (game.secondPlayer?.id as string);
            const finisherLast = await this.gameRepository.findLastAnswerForPlayerInGame(game, finisherId);
            if (finisherLast) {
                const deadline = new Date(finisherLast.date.getTime() + 10_000);
                if (new Date() >= deadline) {
                    const lagger = finisherIsFirst ? (game.secondPlayer!) : game.firstPlayer;
                    const laggerAnswers = finisherIsFirst ? secondAnswers : firstAnswers;
                    for (let pos = laggerAnswers + 1; pos <= 5; pos++) {
                        const q = await this.gameRepository.findQuestionByGameAndPosition(game.id, pos);
                        if (!q) continue;
                        await this.gameRepository.saveAnswer({
                            id: undefined as any,
                            player: undefined as any,
                            player_id: lagger.id,
                            question_id: q.id,
                            status: 'Incorrect' as any,
                            date: new Date()
                        } as Answers);
                    }

                    // Завершаем игру с бонусом скорости по той же логике
                    const firstPlayerLastAnswer = await this.gameRepository.findLastAnswerForPlayerInGame(game, game.firstPlayer.id);
                    const secondPlayerLastAnswer = game.secondPlayer ? await this.gameRepository.findLastAnswerForPlayerInGame(game, game.secondPlayer.id) : null;
                    let firstPlayerFinishedFirst = false;
                    let secondPlayerFinishedFirst = false;
                    if (firstPlayerLastAnswer && secondPlayerLastAnswer) {
                        if (firstPlayerLastAnswer.date < secondPlayerLastAnswer.date) firstPlayerFinishedFirst = true;
                        else if (secondPlayerLastAnswer.date < firstPlayerLastAnswer.date) secondPlayerFinishedFirst = true;
                    }
                    const firstScore2 = game.firstPlayer.score;
                    const secondScore2 = game.secondPlayer?.score || 0;
                    let finalFirstScore2 = firstScore2;
                    let finalSecondScore2 = secondScore2;
                    if (firstPlayerFinishedFirst && firstScore2 > 0) { finalFirstScore2 += 1; game.firstPlayer.score = finalFirstScore2; await this.gameRepository.updatePlayer(game.firstPlayer); }
                    if (secondPlayerFinishedFirst && secondScore2 > 0) { finalSecondScore2 += 1; if (game.secondPlayer) { game.secondPlayer.score = finalSecondScore2; await this.gameRepository.updatePlayer(game.secondPlayer); } }
                    if (finalFirstScore2 > finalSecondScore2) { game.firstPlayer.status = 'Win' as any; if (game.secondPlayer) game.secondPlayer.status = 'Lose' as any; }
                    else if (finalSecondScore2 > finalFirstScore2) { if (game.secondPlayer) game.secondPlayer.status = 'Win' as any; game.firstPlayer.status = 'Lose' as any; }
                    else { game.firstPlayer.status = 'Draw' as any; if (game.secondPlayer) game.secondPlayer.status = 'Draw' as any; }
                    game.status = Status.Finished;
                    game.finishGameDate = new Date();
                    await this.gameRepository.updatePlayer(game.firstPlayer);
                    if (game.secondPlayer) await this.gameRepository.updatePlayer(game.secondPlayer);
                    await this.gameRepository.updateGame(game);
                }
            }
        }

        return {
            questionId: saved.question_id,
            answerStatus: saved.status,
            addedAt: saved.date.toISOString()
        };
}
}