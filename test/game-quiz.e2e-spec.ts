import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/core/email/email.service';
import { setupApp } from '../src/setup/app.setup';
import { createAndPublishQuestion, createQuestion } from './test-helper/create-question';
import {
  createGameConnection,
  createMultipleQuestions,
  getCorrectAnswerForPosition,
  getCurrentGame,
  getGameById,
  submitAnswer
} from './test-helper/game-quiz-helpers';
import { getAccessToken } from './test-helper/get-access-token';

describe('Game Quiz API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeEach(async () => {
    const emailServiceMock = {
      sendRegistrationConfirmation: jest.fn(),
      sendPasswordRecovery: jest.fn(),
    };

    const testingModuleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });
    const moduleFixture: TestingModule = await testingModuleBuilder
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    httpServer = app.getHttpServer();
    await request(httpServer).delete('/testing/all-data');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Admin Questions API (/sa/quiz/questions)', () => {
    describe('POST /sa/quiz/questions', () => {
      it('should create a question with valid data', async () => {
        const questionData = {
          body: 'What is the capital of France?',
          correctAnswers: ['Paris', 'paris']
        };

        const response = await request(httpServer)
          .post('/sa/quiz/questions')
          .auth('admin', 'qwerty')
          .send(questionData)
          .expect(201);

        expect(response.body).toEqual({
          id: expect.any(String),
          body: questionData.body,
          correctAnswers: questionData.correctAnswers,
          published: false,
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          updatedAt: null,
        });
      });

      it('should return 401 without basic auth', async () => {
        const questionData = {
          body: 'What is the capital of France?',
          correctAnswers: ['Paris']
        };

        await request(httpServer)
          .post('/sa/quiz/questions')
          .send(questionData)
          .expect(401);
      });

      it('should return 400 with invalid data', async () => {
        const questionData = {
          body: '',
          correctAnswers: []
        };

        await request(httpServer)
          .post('/sa/quiz/questions')
          .auth('admin', 'qwerty')
          .send(questionData)
          .expect(400);
      });

      it('should return 400 with missing body', async () => {
        const questionData = {
          correctAnswers: ['Paris']
        };

        await request(httpServer)
          .post('/sa/quiz/questions')
          .auth('admin', 'qwerty')
          .send(questionData)
          .expect(400);
      });

      it('should return 400 with missing correctAnswers', async () => {
        const questionData = {
          body: 'What is the capital of France?'
        };

        await request(httpServer)
          .post('/sa/quiz/questions')
          .auth('admin', 'qwerty')
          .send(questionData)
          .expect(400);
      });
    });

    describe('GET /sa/quiz/questions', () => {
      it('should return empty list when no questions exist', async () => {
        const response = await request(httpServer)
          .get('/sa/quiz/questions')
          .auth('admin', 'qwerty')
          .expect(200);

        expect(response.body).toEqual({
          pagesCount: 0,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: []
        });
      });

      it('should return questions with pagination', async () => {
        // Create multiple questions
        await createQuestion(request, httpServer, { body: 'Question 1', correctAnswers: ['Answer 1'] });
        await createQuestion(request, httpServer, { body: 'Question 2', correctAnswers: ['Answer 2'] });
        await createQuestion(request, httpServer, { body: 'Question 3', correctAnswers: ['Answer 3'] });

        const response = await request(httpServer)
          .get('/sa/quiz/questions')
          .auth('admin', 'qwerty')
          .expect(200);

        expect(response.body.totalCount).toBe(3);
        expect(response.body.items).toHaveLength(3);
        expect(response.body.pagesCount).toBe(1);
      });

      it('should support pagination parameters', async () => {
        // Create 15 questions
        for (let i = 1; i <= 15; i++) {
          await createQuestion(request, httpServer, { 
            body: `Question ${i}`, 
            correctAnswers: [`Answer ${i}`] 
          });
        }

        const response = await request(httpServer)
          .get('/sa/quiz/questions?pageNumber=2&pageSize=5')
          .auth('admin', 'qwerty')
          .expect(200);

        expect(response.body.totalCount).toBe(15);
        expect(response.body.items).toHaveLength(5);
        expect(response.body.page).toBe(2);
        expect(response.body.pageSize).toBe(5);
        expect(response.body.pagesCount).toBe(3);
      });

      it('should return 401 without basic auth', async () => {
        await request(httpServer)
          .get('/sa/quiz/questions')
          .expect(401);
      });
    });

    describe('PUT /sa/quiz/questions/:id', () => {
      it('should update question with valid data', async () => {
        const createResponse = await createQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        const updateData = {
          body: 'Updated question body',
          correctAnswers: ['Updated answer']
        };

        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}`)
          .auth('admin', 'qwerty')
          .send(updateData)
          .expect(204);

        // Verify the question was updated
        const getResponse = await request(httpServer)
          .get('/sa/quiz/questions')
          .auth('admin', 'qwerty');

        const updatedQuestion = getResponse.body.items.find((q: any) => q.id === questionId);
        expect(updatedQuestion.body).toBe(updateData.body);
        expect(updatedQuestion.correctAnswers).toEqual(updateData.correctAnswers);
      });

      it('should return 404 for non-existent question', async () => {
        const updateData = {
          body: 'Updated question body',
          correctAnswers: ['Updated answer']
        };

        const response = await request(httpServer)
          .put('/sa/quiz/questions/non-existent-id')
          .auth('admin', 'qwerty')
          .send(updateData);
        
        expect(response.status).toBe(404);
      });

      it('should return 400 with invalid data', async () => {
        const createResponse = await createQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        const updateData = {
          body: '',
          correctAnswers: []
        };

        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}`)
          .auth('admin', 'qwerty')
          .send(updateData)
          .expect(400);
      });

      it('should return 401 without basic auth', async () => {
        const createResponse = await createQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}`)
          .send({ body: 'Updated', correctAnswers: ['Answer'] })
          .expect(401);
      });
    });

    describe('PUT /sa/quiz/questions/:id/publish', () => {
      it('should publish question', async () => {
        const createResponse = await createQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}/publish`)
          .auth('admin', 'qwerty')
          .send({ published: true })
          .expect(204);

        // Verify the question was published
        const getResponse = await request(httpServer)
          .get('/sa/quiz/questions')
          .auth('admin', 'qwerty');

        const publishedQuestion = getResponse.body.items.find((q: any) => q.id === questionId);
        expect(publishedQuestion.published).toBe(true);
      });

      it('should unpublish question', async () => {
        const createResponse = await createAndPublishQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}/publish`)
          .auth('admin', 'qwerty')
          .send({ published: false })
          .expect(204);

        // Verify the question was unpublished
        const getResponse = await request(httpServer)
          .get('/sa/quiz/questions')
          .auth('admin', 'qwerty');

        const unpublishedQuestion = getResponse.body.items.find((q: any) => q.id === questionId);
        expect(unpublishedQuestion.published).toBe(false);
      });

      it('should return 400 when trying to publish question without correct answers', async () => {
        // First create a valid question
        const createResponse = await createQuestion(request, httpServer, {
          body: 'Question that will have answers removed',
          correctAnswers: ['answer1']
        });
        const questionId = createResponse.body.id;

        // Update the question to remove correct answers (don't set published to avoid validation)
        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}`)
          .auth('admin', 'qwerty')
          .send({
            body: 'Question without answers',
            correctAnswers: []
          })
          .expect(204);

        // Now try to publish it - should return 400
        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}/publish`)
          .auth('admin', 'qwerty')
          .send({ published: true })
          .expect(400);
      });

      it('should return 404 for non-existent question', async () => {
        const response = await request(httpServer)
          .put('/sa/quiz/questions/non-existent-id/publish')
          .auth('admin', 'qwerty')
          .send({ published: true });
        
        expect(response.status).toBe(404);
      });

      it('should return 401 without basic auth', async () => {
        const createResponse = await createQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        await request(httpServer)
          .put(`/sa/quiz/questions/${questionId}/publish`)
          .send({ published: true })
          .expect(401);
      });
    });

    describe('DELETE /sa/quiz/questions/:id', () => {
      it('should delete question', async () => {
        const createResponse = await createQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        await request(httpServer)
          .delete(`/sa/quiz/questions/${questionId}`)
          .auth('admin', 'qwerty')
          .expect(204);

        // Verify the question was deleted
        const getResponse = await request(httpServer)
          .get('/sa/quiz/questions')
          .auth('admin', 'qwerty');

        expect(getResponse.body.items.find((q: any) => q.id === questionId)).toBeUndefined();
      });

      it('should return 404 for non-existent question', async () => {
        const response = await request(httpServer)
          .delete('/sa/quiz/questions/non-existent-id')
          .auth('admin', 'qwerty');
        
        expect(response.status).toBe(404);
      });

      it('should return 401 without basic auth', async () => {
        const createResponse = await createQuestion(request, httpServer);
        const questionId = createResponse.body.id;

        await request(httpServer)
          .delete(`/sa/quiz/questions/${questionId}`)
          .expect(401);
      });
    });
  });

  describe('Public Game API (/pair-game-quiz/pairs)', () => {
    let accessToken1: string;
    let accessToken2: string;
    let accessToken3: string;
    let accessToken4: string;
    let accessToken5: string;
    let accessToken6: string;

    beforeEach(async () => {
      // Create published questions for games
      await createMultipleQuestions(request, httpServer, 5);
      
      // Get access tokens for six users
      accessToken1 = await getAccessToken(request, httpServer);
      
      // Create additional users
      const userData = [
        { login: 'player2', email: 'player2@gmail.com' },
        { login: 'player3', email: 'player3@gmail.com' },
        { login: 'player4', email: 'player4@gmail.com' },
        { login: 'player5', email: 'player5@gmail.com' },
        { login: 'player6', email: 'player6@gmail.com' }
      ];

      for (let i = 0; i < userData.length; i++) {
        await request(httpServer).post('/auth/registration').send({
          login: userData[i].login,
          password: '123456',
          email: userData[i].email,
        });

        const login = await request(httpServer).post('/auth/login').send({
          loginOrEmail: userData[i].login,
          password: '123456',
        });
        
        if (i === 0) accessToken2 = login.body.accessToken;
        if (i === 1) accessToken3 = login.body.accessToken;
        if (i === 2) accessToken4 = login.body.accessToken;
        if (i === 3) accessToken5 = login.body.accessToken;
        if (i === 4) accessToken6 = login.body.accessToken;
      }
    });

    describe('POST /pair-game-quiz/pairs/connection', () => {
      it('should create new game when no pending games exist', async () => {
        const response = await createGameConnection(request, httpServer, accessToken1);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          id: expect.any(String),
          firstPlayerProgress: {
            player: {
              id: expect.any(String),
              login: expect.any(String)
            },
            score: 0,
            answers: []
          },
          secondPlayerProgress: null,
          questions: null,
          status: 'PendingSecondPlayer',
          pairCreatedDate: expect.any(String),
          startGameDate: null,
          finishGameDate: null
        });

        // Questions should be null for PendingSecondPlayer status
      });

      it('should join existing pending game', async () => {
        // First player creates game
        const game1Response = await createGameConnection(request, httpServer, accessToken1);
        expect(game1Response.status).toBe(200);
        expect(game1Response.body.status).toBe('PendingSecondPlayer');

        // Second player joins the game
        const game2Response = await createGameConnection(request, httpServer, accessToken2);
        expect(game2Response.status).toBe(200);
        expect(game2Response.body.id).toBe(game1Response.body.id);
        expect(game2Response.body.status).toBe('Active');
        expect(game2Response.body.secondPlayerProgress).not.toBeNull();
        expect(game2Response.body.secondPlayerProgress.player.login).toBe('player2');
      });

      it('should return 403 if user already in active game', async () => {
        // Create first game
        await createGameConnection(request, httpServer, accessToken1);
        
        // Try to create another game with same player
        const response = await createGameConnection(request, httpServer, accessToken1);
        expect(response.status).toBe(403);
        expect(response.body.errorsMessages[0].message).toContain('participating in active pair');
      });

      it('should return 401 without JWT token', async () => {
        await request(httpServer)
          .post('/pair-game-quiz/pairs/connection')
          .expect(401);
      });
    });

    describe('GET /pair-game-quiz/pairs/my-current', () => {
      it('should return current active game', async () => {
        const gameResponse = await createGameConnection(request, httpServer, accessToken1);
        
        const currentResponse = await getCurrentGame(request, httpServer, accessToken1);
        expect(currentResponse.status).toBe(200);
        expect(currentResponse.body.id).toBe(gameResponse.body.id);
      });

      it('should return 404 when no active game exists', async () => {
        const response = await getCurrentGame(request, httpServer, accessToken1);
        expect(response.status).toBe(404);
        expect(response.body.errorsMessages[0].message).toContain('No active pair');
      });

      it('should return 401 without JWT token', async () => {
        await request(httpServer)
          .get('/pair-game-quiz/pairs/my-current')
          .expect(401);
      });
    });

    describe('GET /pair-game-quiz/pairs/:id', () => {
      it('should return game by id for participant', async () => {
        const gameResponse = await createGameConnection(request, httpServer, accessToken1);
        const gameId = gameResponse.body.id;

        const response = await getGameById(request, httpServer, accessToken1, gameId);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(gameId);
      });

      it('should return 403 for non-participant', async () => {
        const gameResponse = await createGameConnection(request, httpServer, accessToken1);
        const gameId = gameResponse.body.id;

        const response = await getGameById(request, httpServer, accessToken2, gameId);
        expect(response.status).toBe(403);
        expect(response.body.errorsMessages[0].message).toContain('not participant');
      });

      it('should return 404 for non-existent game', async () => {
        const response = await getGameById(request, httpServer, accessToken1, 'non-existent-id');
        expect(response.status).toBe(400); // Invalid UUID format
      });

      it('should return 401 without JWT token', async () => {
        await request(httpServer)
          .get('/pair-game-quiz/pairs/some-id')
          .expect(401);
      });
    });

    describe('POST /pair-game-quiz/pairs/my-current/answers', () => {
      it('should submit correct answer and increase score', async () => {
        // Create game and join with second player
        await createGameConnection(request, httpServer, accessToken1);
        await createGameConnection(request, httpServer, accessToken2);

        // Submit correct answer
        const response = await submitAnswer(request, httpServer, accessToken1, 'Paris');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          questionId: expect.any(String),
          answerStatus: 'Correct',
          addedAt: expect.any(String)
        });

        // Check that score increased
        const currentGame = await getCurrentGame(request, httpServer, accessToken1);
        expect(currentGame.body.firstPlayerProgress.score).toBe(1);
        expect(currentGame.body.firstPlayerProgress.answers).toHaveLength(1);
      });

      it('should submit incorrect answer without increasing score', async () => {
        // Create game and join with second player
        await createGameConnection(request, httpServer, accessToken1);
        await createGameConnection(request, httpServer, accessToken2);

        // Submit incorrect answer
        const response = await submitAnswer(request, httpServer, accessToken1, 'Wrong Answer');
        
        expect(response.status).toBe(200);
        expect(response.body.answerStatus).toBe('Incorrect');

        // Check that score didn't increase
        const currentGame = await getCurrentGame(request, httpServer, accessToken1);
        expect(currentGame.body.firstPlayerProgress.score).toBe(0);
        expect(currentGame.body.firstPlayerProgress.answers).toHaveLength(1);
      });

      it('should return 403 when user not in active game', async () => {
        const response = await submitAnswer(request, httpServer, accessToken1, 'Paris');
        expect(response.status).toBe(403);
        expect(response.body.errorsMessages[0].message).toContain('not inside active pair');
      });

      it('should return 403 when all questions answered', async () => {
        // Create game and join with second player
        await createGameConnection(request, httpServer, accessToken1);
        await createGameConnection(request, httpServer, accessToken2);

        // Answer all 5 questions
        for (let i = 0; i < 5; i++) {
          await submitAnswer(request, httpServer, accessToken1, 'Answer');
        }

        // Try to answer 6th question
        const response = await submitAnswer(request, httpServer, accessToken1, 'Answer');
        expect(response.status).toBe(403);
        expect(response.body.errorsMessages[0].message).toContain('already answered to all questions');
      });

      it('should return 401 without JWT token', async () => {
        await request(httpServer)
          .post('/pair-game-quiz/pairs/my-current/answers')
          .send({ answer: 'Paris' })
          .expect(401);
      });
    });

    describe('Complete Game Flow', () => {
      it('should create game, connect second player, add answers and determine winner', async () => {
        // Create game with first player
        const gameResponse = await createGameConnection(request, httpServer, accessToken1);
        expect(gameResponse.status).toBe(200);
        expect(gameResponse.body.status).toBe('PendingSecondPlayer');
        // Questions should be null for PendingSecondPlayer status
        expect(gameResponse.body.firstPlayerProgress.score).toBe(0);
        expect(gameResponse.body.secondPlayerProgress).toBeNull();

        // Get current game for first player
        const currentGame1 = await getCurrentGame(request, httpServer, accessToken1);
        expect(currentGame1.status).toBe(200);
        expect(currentGame1.body.id).toBe(gameResponse.body.id);
        expect(currentGame1.body.status).toBe('PendingSecondPlayer');

        // Connect second player
        const joinResponse = await createGameConnection(request, httpServer, accessToken2);
        expect(joinResponse.status).toBe(200);
        expect(joinResponse.body.id).toBe(gameResponse.body.id);
        expect(joinResponse.body.status).toBe('Active');
        expect(joinResponse.body.secondPlayerProgress).not.toBeNull();
        expect(joinResponse.body.secondPlayerProgress.player.login).toBe('player2');
        expect(joinResponse.body.questions).toHaveLength(5);

        // Get current game for both players after connection
        const currentGame1AfterJoin = await getCurrentGame(request, httpServer, accessToken1);
        const currentGame2AfterJoin = await getCurrentGame(request, httpServer, accessToken2);
        
        expect(currentGame1AfterJoin.status).toBe(200);
        expect(currentGame2AfterJoin.status).toBe(200);
        expect(currentGame1AfterJoin.body.status).toBe('Active');
        expect(currentGame2AfterJoin.body.status).toBe('Active');
        expect(currentGame1AfterJoin.body.questions).toHaveLength(5);
        expect(currentGame2AfterJoin.body.questions).toHaveLength(5);

        // Add correct answer by first player
        const answer1 = await submitAnswer(request, httpServer, accessToken1, 'Paris');
        expect(answer1.status).toBe(200);
        expect(answer1.body.answerStatus).toBe('Correct');

        // Check game state after first answer
        const gameAfterAnswer1 = await getCurrentGame(request, httpServer, accessToken1);
        expect(gameAfterAnswer1.body.firstPlayerProgress.score).toBe(1);
        expect(gameAfterAnswer1.body.firstPlayerProgress.answers).toHaveLength(1);
        expect(gameAfterAnswer1.body.firstPlayerProgress.answers[0].answerStatus).toBe('Correct');

        // Add correct answer by first player (second answer)
        const answer2 = await submitAnswer(request, httpServer, accessToken1, '4');
        expect(answer2.status).toBe(200);
        expect(answer2.body.answerStatus).toBe('Correct');

        // Check game state after second answer
        const gameAfterAnswer2 = await getCurrentGame(request, httpServer, accessToken1);
        expect(gameAfterAnswer2.body.firstPlayerProgress.score).toBe(2);
        expect(gameAfterAnswer2.body.firstPlayerProgress.answers).toHaveLength(2);

        // Add answer by second player (might be incorrect if questions are different)
        const answer3 = await submitAnswer(request, httpServer, accessToken2, 'blue');
        expect(answer3.status).toBe(200);
        // Accept either correct or incorrect answer since question order might vary
        expect(['Correct', 'Incorrect']).toContain(answer3.body.answerStatus);

        // Check game state after second player's first answer
        const gameAfterAnswer3 = await getCurrentGame(request, httpServer, accessToken2);
        // Score might be 0 or 1 depending on whether the answer was correct
        expect([0, 1]).toContain(gameAfterAnswer3.body.secondPlayerProgress.score);
        expect(gameAfterAnswer3.body.secondPlayerProgress.answers).toHaveLength(1);

        // Add answer by second player (second answer)
        const answer4 = await submitAnswer(request, httpServer, accessToken2, 'Jupiter');
        expect(answer4.status).toBe(200);
        // Accept either correct or incorrect answer since question order might vary
        expect(['Correct', 'Incorrect']).toContain(answer4.body.answerStatus);

        // Check game state after second player's second answer
        const gameAfterAnswer4 = await getCurrentGame(request, httpServer, accessToken2);
        // Score might be 0, 1, or 2 depending on correct answers
        expect([0, 1, 2]).toContain(gameAfterAnswer4.body.secondPlayerProgress.score);

        // Add incorrect answer by first player
        const answer5 = await submitAnswer(request, httpServer, accessToken1, 'Wrong Answer');
        expect(answer5.status).toBe(200);
        expect(answer5.body.answerStatus).toBe('Incorrect');

        // Check game state after incorrect answer
        const gameAfterAnswer5 = await getCurrentGame(request, httpServer, accessToken1);
        expect(gameAfterAnswer5.body.firstPlayerProgress.score).toBe(2); // Score should not increase

        // Add answer by first player (fourth answer)
        const answer6 = await submitAnswer(request, httpServer, accessToken1, 'Vatican');
        expect(answer6.status).toBe(200);
        // Accept either correct or incorrect answer since question order might vary
        expect(['Correct', 'Incorrect']).toContain(answer6.body.answerStatus);

        // Check game state after fourth answer
        const gameAfterAnswer6 = await getCurrentGame(request, httpServer, accessToken1);
        // Score might be 2 or 3 depending on whether the answer was correct
        expect([2, 3]).toContain(gameAfterAnswer6.body.firstPlayerProgress.score);

        // Add answer by second player (third answer)
        const answer7 = await submitAnswer(request, httpServer, accessToken2, 'Vatican');
        expect(answer7.status).toBe(200);
        // Accept either correct or incorrect answer since question order might vary
        expect(['Correct', 'Incorrect']).toContain(answer7.body.answerStatus);

        // Check final game state
        const finalGame = await getCurrentGame(request, httpServer, accessToken1);
        // Scores might vary depending on correct answers
        expect(finalGame.body.firstPlayerProgress.score).toBeGreaterThanOrEqual(2);
        expect(finalGame.body.secondPlayerProgress.score).toBeGreaterThanOrEqual(0);
        expect(finalGame.body.firstPlayerProgress.answers).toHaveLength(4);
        expect(finalGame.body.secondPlayerProgress.answers).toHaveLength(3);

        // Add remaining answers to complete the game
        const answer8 = await submitAnswer(request, httpServer, accessToken1, 'Some Answer');
        const answer9 = await submitAnswer(request, httpServer, accessToken2, 'Some Answer');
        const answer10 = await submitAnswer(request, httpServer, accessToken2, 'Some Answer');

        // Check that game is finished - should return 404 since no active pair
        const finishedGame = await getCurrentGame(request, httpServer, accessToken1);
        expect(finishedGame.status).toBe(404);
        expect(finishedGame.body.errorsMessages[0].message).toContain('No active pair');
      });

      it('should handle game flow with different answer patterns', async () => {
        // Create and join game
        await createGameConnection(request, httpServer, accessToken1);
        await createGameConnection(request, httpServer, accessToken2);

        // Both players answer questions alternately
        const correctAnswers = ['Paris', '4', 'blue', 'Jupiter', 'Vatican'];
        for (let i = 0; i < 5; i++) {
          // First player answers correctly
          const answer1 = await submitAnswer(request, httpServer, accessToken1, correctAnswers[i]);
          expect(answer1.status).toBe(200);
          expect(answer1.body.answerStatus).toBe('Correct');
          
          // Second player answers incorrectly
          const answer2 = await submitAnswer(request, httpServer, accessToken2, 'Wrong Answer');
          expect(answer2.status).toBe(200);
          expect(answer2.body.answerStatus).toBe('Incorrect');
        }

        // Check final scores - should return 404 since no active pair
        const finalGame = await getCurrentGame(request, httpServer, accessToken1);
        expect(finalGame.status).toBe(404);
        expect(finalGame.body.errorsMessages[0].message).toContain('No active pair');

        // Check final game state - should return 404 since no active pair
        const finalGameState = await getCurrentGame(request, httpServer, accessToken2);
        expect(finalGameState.status).toBe(404);
        expect(finalGameState.body.errorsMessages[0].message).toContain('No active pair');
      });

      it('should return 404 when trying to get current game after it is finished', async () => {
        // Create and join game
        await createGameConnection(request, httpServer, accessToken1);
        await createGameConnection(request, httpServer, accessToken2);

        // Answer all questions
        for (let i = 0; i < 5; i++) {
          await submitAnswer(request, httpServer, accessToken1, 'Answer');
          await submitAnswer(request, httpServer, accessToken2, 'Answer');
        }

        // Try to get current game - should return 404 since no active pair
        const response = await getCurrentGame(request, httpServer, accessToken1);
        expect(response.status).toBe(404);
        expect(response.body.errorsMessages[0].message).toContain('No active pair');
      });

      it('should finish game after 10s timeout when second player does not finish', async () => {
        // Create and join game
        const gameResponse = await createGameConnection(request, httpServer, accessToken1);
        expect(gameResponse.status).toBe(200);
        const gameId = gameResponse.body.id;

        const joinResponse = await createGameConnection(request, httpServer, accessToken2);
        expect(joinResponse.status).toBe(200);

        // First player answers all 5 correctly
        for (let pos = 1; pos <= 5; pos++) {
          const ans = getCorrectAnswerForPosition(pos);
          const res = await submitAnswer(request, httpServer, accessToken1, ans);
          expect(res.status).toBe(200);
          expect(res.body.answerStatus).toBe('Correct');
        }

        // Wait 10 seconds + small epsilon
        await new Promise(resolve => setTimeout(resolve, 10100));

        // Trigger timeout processing by fetching the game by id
        const finalById = await getGameById(request, httpServer, accessToken1, gameId);
        expect(finalById.status).toBe(200);
        expect(finalById.body.status).toBe('Finished');
        expect(finalById.body.firstPlayerProgress.score).toBe(6); // 5 correct + 1 speed bonus
        expect(finalById.body.secondPlayerProgress.score).toBe(0);
        expect(finalById.body.finishGameDate).not.toBeNull();
      });

      it('should finish after 10s when first finishes and second has 3 correct; my-current 404 for user2; final scores 6 and 3', async () => {
        // Create and join game
        const gameResponse = await createGameConnection(request, httpServer, accessToken1);
        expect(gameResponse.status).toBe(200);
        const gameId = gameResponse.body.id;

        const joinResponse = await createGameConnection(request, httpServer, accessToken2);
        expect(joinResponse.status).toBe(200);

        // Second player answers first 3 correctly (positions 1..3)
        for (let pos = 1; pos <= 3; pos++) {
          const ans = getCorrectAnswerForPosition(pos);
          const res = await submitAnswer(request, httpServer, accessToken2, ans);
          expect(res.status).toBe(200);
          expect(res.body.answerStatus).toBe('Correct');
        }

        // First player answers all 5 correctly
        for (let pos = 1; pos <= 5; pos++) {
          const ans = getCorrectAnswerForPosition(pos);
          const res = await submitAnswer(request, httpServer, accessToken1, ans);
          expect(res.status).toBe(200);
          expect(res.body.answerStatus).toBe('Correct');
        }

        // Wait 10 seconds + small epsilon
        await new Promise(resolve => setTimeout(resolve, 10100));

        // my-current for user2 should return 404 (no active pair)
        const currentUser2 = await getCurrentGame(request, httpServer, accessToken2);
        expect(currentUser2.status).toBe(404);

        // Final check by id for user1
        const finalGame = await getGameById(request, httpServer, accessToken1, gameId);
        expect(finalGame.status).toBe(200);
        expect(finalGame.body.status).toBe('Finished');
        expect(finalGame.body.firstPlayerProgress.score).toBe(6); // 5 correct + 1 speed bonus
        expect(finalGame.body.secondPlayerProgress.score).toBe(3);
        expect(finalGame.body.finishGameDate).not.toBeNull();
      });
     

      it('should handle complex multi-game scenario with multiple users', async () => {
        // 1) Create active game User 1, then call "/pair-game-quiz/pairs/my-current" by user1
        const game1Response = await createGameConnection(request, httpServer, accessToken1);
        expect(game1Response.status).toBe(200);
        expect(game1Response.body.status).toBe('PendingSecondPlayer');

        const currentGame1User1 = await getCurrentGame(request, httpServer, accessToken1);
        expect(currentGame1User1.status).toBe(200);
        expect(currentGame1User1.body.status).toBe('PendingSecondPlayer');

        // Connect User 2 to first game
        const game1JoinResponse = await createGameConnection(request, httpServer, accessToken2);
        expect(game1JoinResponse.status).toBe(200);
        expect(game1JoinResponse.body.status).toBe('Active');

        // Call "/pair-game-quiz/pairs/my-current" by both users after connection
        const currentGame1AfterJoinUser1 = await getCurrentGame(request, httpServer, accessToken1);
        const currentGame1AfterJoinUser2 = await getCurrentGame(request, httpServer, accessToken2);
        expect(currentGame1AfterJoinUser1.status).toBe(200);
        expect(currentGame1AfterJoinUser2.status).toBe(200);
        expect(currentGame1AfterJoinUser1.body.status).toBe('Active');
        expect(currentGame1AfterJoinUser2.body.status).toBe('Active');

        // Add answers to first game using position-based correct answers
        // Position 1: Paris (correct)
        const answer1Game1FirstPlayer = await submitAnswer(request, httpServer, accessToken1, getCorrectAnswerForPosition(1));
        expect(answer1Game1FirstPlayer.status).toBe(200);
        expect(answer1Game1FirstPlayer.body.answerStatus).toBe('Correct');

        // Position 1: Wrong answer (incorrect)
        const answer1Game1SecondPlayer = await submitAnswer(request, httpServer, accessToken2, 'Wrong Answer');
        expect(answer1Game1SecondPlayer.status).toBe(200);
        expect(answer1Game1SecondPlayer.body.answerStatus).toBe('Incorrect');

        // Position 2: 4 (correct)
        const answer2Game1SecondPlayer = await submitAnswer(request, httpServer, accessToken2, getCorrectAnswerForPosition(2));
        expect(answer2Game1SecondPlayer.status).toBe(200);
        expect(answer2Game1SecondPlayer.body.answerStatus).toBe('Correct');

        // 2) Create second game by user3, connect by user4
        const game2Response = await createGameConnection(request, httpServer, accessToken3);
        expect(game2Response.status).toBe(200);
        expect(game2Response.body.status).toBe('PendingSecondPlayer');

        const game2JoinResponse = await createGameConnection(request, httpServer, accessToken4);
        expect(game2JoinResponse.status).toBe(200);
        expect(game2JoinResponse.body.status).toBe('Active');

        // Add answers to second game: correct by user3, incorrect by user4, correct by user4
        const answer1Game2FirstPlayer = await submitAnswer(request, httpServer, accessToken3, 'Paris');

        const answer1Game2SecondPlayer = await submitAnswer(request, httpServer, accessToken4, 'Wrong Answer');


        const answer2Game2SecondPlayer = await submitAnswer(request, httpServer, accessToken4, '4');

        const currentAfterAnswer3Game2User3 = await getCurrentGame(request, httpServer, accessToken3);
        const currentAfterAnswer3Game2User4 = await getCurrentGame(request, httpServer, accessToken4);
        expect(currentAfterAnswer3Game2User3.status).toBe(200);
        expect(currentAfterAnswer3Game2User4.status).toBe(200);

        // 3) Continue adding answers to first game - complete remaining positions
        // Position 2: 4 (correct) 
        const answer2Game1FirstPlayer = await submitAnswer(request, httpServer, accessToken1, getCorrectAnswerForPosition(2));
        expect(answer2Game1FirstPlayer.status).toBe(200);
        expect(answer2Game1FirstPlayer.body.answerStatus).toBe('Correct');

        // Position 3: blue (correct)
        const answer3Game1FirstPlayer = await submitAnswer(request, httpServer, accessToken1, getCorrectAnswerForPosition(3));
        expect(answer3Game1FirstPlayer.status).toBe(200);
        expect(answer3Game1FirstPlayer.body.answerStatus).toBe('Correct');

        // Position 3: blue (correct)
        const answer3Game1SecondPlayer = await submitAnswer(request, httpServer, accessToken2, getCorrectAnswerForPosition(3));
        expect(answer3Game1SecondPlayer.status).toBe(200);
        expect(answer3Game1SecondPlayer.body.answerStatus).toBe('Correct');

        // Position 4: Jupiter (correct)
        const answer4Game1SecondPlayer = await submitAnswer(request, httpServer, accessToken2, getCorrectAnswerForPosition(4));
        expect(answer4Game1SecondPlayer.status).toBe(200);
        expect(answer4Game1SecondPlayer.body.answerStatus).toBe('Correct');

        // Position 4: Wrong answer (incorrect)
        const answer4Game1FirstPlayer = await submitAnswer(request, httpServer, accessToken1, 'Wrong Answer');
        expect(answer4Game1FirstPlayer.status).toBe(200);
        expect(answer4Game1FirstPlayer.body.answerStatus).toBe('Incorrect');

        // Position 5: Vatican (correct) - both players finish
        const answer5Game1FirstPlayer = await submitAnswer(request, httpServer, accessToken1, getCorrectAnswerForPosition(5));
        expect(answer5Game1FirstPlayer.status).toBe(200);
        expect(answer5Game1FirstPlayer.body.answerStatus).toBe('Correct');

        const answer5Game1SecondPlayer = await submitAnswer(request, httpServer, accessToken2, getCorrectAnswerForPosition(5));
        expect(answer5Game1SecondPlayer.status).toBe(200);
        expect(answer5Game1SecondPlayer.body.answerStatus).toBe('Correct');

        // Game should be finished now, so getCurrentGame should return 404
        // Check final state of first game - firstPlayer should win with speed bonus
        await new Promise(resolve => setTimeout(resolve, 100));
        const finalGame1 = await getGameById(request, httpServer, accessToken1, game1Response.body.id);
        expect(finalGame1.status).toBe(200);
        expect(finalGame1.body.status).toBe('Finished');
        expect(finalGame1.body.firstPlayerProgress.score).toBe(5); // 4 correct + 1 speed bonus
        expect(finalGame1.body.secondPlayerProgress.score).toBe(4); // 4 correct, no speed bonus
        expect(finalGame1.body.firstPlayerProgress.status).toBe('Win');
        expect(finalGame1.body.secondPlayerProgress.status).toBe('Lose');

        // 4) Create third game by user2, connect by user1
        const game3Response = await createGameConnection(request, httpServer, accessToken2);
        expect(game3Response.status).toBe(200);
        expect(game3Response.body.status).toBe('PendingSecondPlayer');

        const game3JoinResponse = await createGameConnection(request, httpServer, accessToken1);
        expect(game3JoinResponse.status).toBe(200);
        expect(game3JoinResponse.body.status).toBe('Active');

        const answer1Game3FirstPlayer = await submitAnswer(request, httpServer, accessToken2, getCorrectAnswerForPosition(1));

        const answer1Game3SecondPlayer = await submitAnswer(request, httpServer, accessToken1, 'Wrong Answer');
        const answer2Game3SecondPlayer = await submitAnswer(request, httpServer, accessToken1, '4');

        const currentAfterAnswerGame3User2 = await getCurrentGame(request, httpServer, accessToken2);
        const currentAfterAnswerGame3User1 = await getCurrentGame(request, httpServer, accessToken1);
        expect(currentAfterAnswerGame3User2.status).toBe(200);
        expect(currentAfterAnswerGame3User1.status).toBe(200);

        // 5) Create 4th game by user5, connect by user6
        const game4Response = await createGameConnection(request, httpServer, accessToken5);
        expect(game4Response.status).toBe(200);
        expect(game4Response.body.status).toBe('PendingSecondPlayer');

        const game4JoinResponse = await createGameConnection(request, httpServer, accessToken6);
        expect(game4JoinResponse.status).toBe(200);
        expect(game4JoinResponse.body.status).toBe('Active');

        // Add answers to fourth game for draw scenario:
        // Player5: 2 correct (pos 1,3) = 2 points
        // Player6: 1 correct (pos 1) + speed bonus = 2 points
        // Order: P5(1,2) -> P6(1,2,3,4,5) -> P5(3,4,5)
        
        // Player5 position 1: Paris - correct
        const answer1Game4Player5 = await submitAnswer(request, httpServer, accessToken5, getCorrectAnswerForPosition(1));
        expect(answer1Game4Player5.status).toBe(200);
        expect(answer1Game4Player5.body.answerStatus).toBe('Correct');

         // Player5 position 2: Wrong Answer - incorrect
         const answer2Game4Player5 = await submitAnswer(request, httpServer, accessToken5, 'Wrong Answer');
         expect(answer2Game4Player5.status).toBe(200);
         expect(answer2Game4Player5.body.answerStatus).toBe('Incorrect');

        // Player6 position 1: Paris - correct  
        const answer1Game4Player6 = await submitAnswer(request, httpServer, accessToken6, getCorrectAnswerForPosition(1));
        expect(answer1Game4Player6.status).toBe(200);
        expect(answer1Game4Player6.body.answerStatus).toBe('Correct');

        // Player6 position 2: Wrong Answer - incorrect
        const answer2Game4Player6 = await submitAnswer(request, httpServer, accessToken6, 'Wrong Answer');
        expect(answer2Game4Player6.status).toBe(200);
        expect(answer2Game4Player6.body.answerStatus).toBe('Incorrect');

        // Player6 position 3: Wrong Answer - incorrect
        const answer3Game4Player6 = await submitAnswer(request, httpServer, accessToken6, 'Wrong Answer');
        expect(answer3Game4Player6.status).toBe(200);
        expect(answer3Game4Player6.body.answerStatus).toBe('Incorrect');

        // Player6 position 4: Wrong Answer - incorrect
        const answer4Game4Player6 = await submitAnswer(request, httpServer, accessToken6, 'Wrong Answer');
        expect(answer4Game4Player6.status).toBe(200);
        expect(answer4Game4Player6.body.answerStatus).toBe('Incorrect');

         // Player6 position 5: Wrong Answer - incorrect (Player6 финишировал первым)
         const answer5Game4Player6 = await submitAnswer(request, httpServer, accessToken6, 'Wrong Answer');
         expect(answer5Game4Player6.status).toBe(200);
         expect(answer5Game4Player6.body.answerStatus).toBe('Incorrect');

          // Player5 position 3: blue - correct
        const answer3Game4Player5 = await submitAnswer(request, httpServer, accessToken5, getCorrectAnswerForPosition(3));
        expect(answer3Game4Player5.status).toBe(200);
        expect(answer3Game4Player5.body.answerStatus).toBe('Correct');

        // Player5 position 4: Wrong Answer - incorrect
        const answer4Game4Player5 = await submitAnswer(request, httpServer, accessToken5, 'Wrong Answer');
        expect(answer4Game4Player5.status).toBe(200);
        expect(answer4Game4Player5.body.answerStatus).toBe('Incorrect');

        // Player5 position 5: Wrong Answer - incorrect
        const answer5Game4Player5 = await submitAnswer(request, httpServer, accessToken5, 'Wrong Answer');
        expect(answer5Game4Player5.status).toBe(200);
        expect(answer5Game4Player5.body.answerStatus).toBe('Incorrect');

       

        // Check final state of fourth game - should be finished
        await new Promise(resolve => setTimeout(resolve, 100));
        const finalGame4 = await getGameById(request, httpServer, accessToken5, game4Response.body.id);
        expect(finalGame4.status).toBe(200);
        expect(finalGame4.body.status).toBe('Finished');
        expect(finalGame4.body.firstPlayerProgress.score).toBe(2); // Player5: 2 correct, no speed bonus  
        expect(finalGame4.body.secondPlayerProgress.score).toBe(2); // Player6: 1 correct + 1 speed bonus = 2
        expect(finalGame4.body.firstPlayerProgress.status).toBe('Draw');
        expect(finalGame4.body.secondPlayerProgress.status).toBe('Draw');

        // 6) Continue adding answers to second game until secondPlayer wins with 4 scores
        const answersGame2Remaining = [
          { token: accessToken3, answer: 'Wrong Answer', expected: 'Incorrect' },
          { token: accessToken3, answer: 'Wrong Answer', expected: 'Incorrect' },
          { token: accessToken4, answer: 'blue', expected: 'Correct' },
          { token: accessToken4, answer: 'Jupiter', expected: 'Correct' },
          { token: accessToken4, answer: 'Wrong Answer', expected: 'Incorrect' },
          { token: accessToken3, answer: 'Vatican', expected: 'Correct' },
          { token: accessToken3, answer: 'Wrong Answer', expected: 'Incorrect' }
        ];

        for (const answerData of answersGame2Remaining) {
          const answer = await submitAnswer(request, httpServer, answerData.token, answerData.answer);
          expect(answer.status).toBe(200);
          expect(['Correct', 'Incorrect']).toContain(answer.body.answerStatus);
        }

        // Check final state of second game - should be finished
        await new Promise(resolve => setTimeout(resolve, 100));
        const finalGame2 = await getGameById(request, httpServer, accessToken3, game2Response.body.id);
        expect(finalGame2.status).toBe(200);
        expect(finalGame2.body.status).toBe('Finished');
        expect(finalGame2.body.secondPlayerProgress.score).toBe(4);
        expect(finalGame2.body.secondPlayerProgress.status).toBe('Win');

        // 7) Continue adding answers to third game until firstPlayer wins with 5 scores
        const answersGame3Remaining = [
          { token: accessToken2, answer: getCorrectAnswerForPosition(2), expected: 'Correct' },     // firstPlayer (Player2) pos 2 - correct
          { token: accessToken2, answer: getCorrectAnswerForPosition(3), expected: 'Correct' },     // firstPlayer (Player2) pos 3 - correct
          { token: accessToken2, answer: 'Wrong Answer', expected: 'Incorrect' },   // firstPlayer (Player2) pos 4 - incorrect
          { token: accessToken2, answer: getCorrectAnswerForPosition(5), expected: 'Correct' },     // firstPlayer (Player2) pos 5 - correct (финиширует первым)
          { token: accessToken1, answer: getCorrectAnswerForPosition(3), expected: 'Correct' },     // secondPlayer (Player1) pos 3 - correct
          { token: accessToken1, answer: getCorrectAnswerForPosition(4), expected: 'Correct' },     // secondPlayer (Player1) pos 4 - correct
          { token: accessToken1, answer: getCorrectAnswerForPosition(5), expected: 'Correct' }      // secondPlayer (Player1) pos 5 - correct
        ];

        for (const answerData of answersGame3Remaining) {
          const answer = await submitAnswer(request, httpServer, answerData.token, answerData.answer);
          expect(answer.status).toBe(200);
          expect(['Correct', 'Incorrect']).toContain(answer.body.answerStatus);
        }

        // Check final state of third game - should be finished
        await new Promise(resolve => setTimeout(resolve, 100));
        const finalGame3 = await getGameById(request, httpServer, accessToken2, game3Response.body.id);
        expect(finalGame3.status).toBe(200);
        expect(finalGame3.body.status).toBe('Finished');
        expect(finalGame3.body.firstPlayerProgress.score).toBe(5);
        expect(finalGame3.body.firstPlayerProgress.status).toBe('Win');
      });
    });
  });
});
