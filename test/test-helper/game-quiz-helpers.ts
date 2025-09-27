export const createGameConnection = async (request: any, httpServer: any, accessToken: string) => {
  const response = await request(httpServer)
    .post('/pair-game-quiz/pairs/connection')
    .set('Authorization', `Bearer ${accessToken}`);

  return response;
};

export const getCurrentGame = async (request: any, httpServer: any, accessToken: string) => {
  const response = await request(httpServer)
    .get('/pair-game-quiz/pairs/my-current')
    .set('Authorization', `Bearer ${accessToken}`);

  return response;
};

export const submitAnswer = async (request: any, httpServer: any, accessToken: string, answer: string) => {
  const response = await request(httpServer)
    .post('/pair-game-quiz/pairs/my-current/answers')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ answer });

  return response;
};

export const getGameById = async (request: any, httpServer: any, accessToken: string, gameId: string) => {
  const response = await request(httpServer)
    .get(`/pair-game-quiz/pairs/${gameId}`)
    .set('Authorization', `Bearer ${accessToken}`);

  return response;
};

export const createMultipleQuestions = async (request: any, httpServer: any, count: number = 5) => {
  const questions = [
    { body: 'What is the capital of France?', correctAnswers: ['Paris', 'paris'] },
    { body: 'What is 2 + 2?', correctAnswers: ['4', 'four'] },
    { body: 'What color is the sky?', correctAnswers: ['blue', 'Blue'] },
    { body: 'What is the largest planet?', correctAnswers: ['Jupiter', 'jupiter'] },
    { body: 'What is the smallest country?', correctAnswers: ['Vatican', 'vatican', 'Vatican City'] }
  ];

  const createdQuestions: any[] = [];
  
  for (let i = 0; i < Math.min(count, questions.length); i++) {
    const createResponse = await request(httpServer)
      .post('/sa/quiz/questions')
      .auth('admin', 'qwerty')
      .send(questions[i]);

    if (createResponse.status === 201) {
      // Publish the question
      await request(httpServer)
        .put(`/sa/quiz/questions/${createResponse.body.id}/publish`)
        .auth('admin', 'qwerty')
        .send({ published: true });
      
      createdQuestions.push(createResponse.body);
    }
  }

  return createdQuestions;
};

// Helper to get correct answer for position based on standard question order
export const getCorrectAnswerForPosition = (position: number): string => {
  const answers = ['Paris', '4', 'blue', 'Jupiter', 'Vatican'];
  return answers[position - 1] || 'Paris'; // fallback to first answer
};

// Helper to get game questions in order
export const getGameQuestions = async (request: any, httpServer: any, accessToken: string, gameId: string) => {
  const response = await request(httpServer)
    .get(`/pair-game-quiz/pairs/${gameId}`)
    .set('Authorization', `Bearer ${accessToken}`);
  
  return response.body.questions || [];
};
