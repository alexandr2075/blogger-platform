export const createQuestion = async (request: any, httpServer: any, questionData?: any) => {
  const defaultQuestion = {
    body: 'What is the capital of France?',
    correctAnswers: ['Paris', 'paris']
  };

  const question = { ...defaultQuestion, ...questionData };

  const response = await request(httpServer)
    .post('/sa/quiz/questions')
    .auth('admin', 'qwerty')
    .send(question);

  return response;
};

export const createAndPublishQuestion = async (request: any, httpServer: any, questionData?: any) => {
  const createResponse = await createQuestion(request, httpServer, questionData);
  
  if (createResponse.status === 201) {
    await request(httpServer)
      .put(`/sa/quiz/questions/${createResponse.body.id}/publish`)
      .auth('admin', 'qwerty')
      .send({ published: true });
  }

  return createResponse;
};
