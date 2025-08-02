export const registrationAndLoginUser = async (
  request: typeof import('supertest'),
  httpServer: any,
  userData?: {
    login: string;
    password: string;
    email: string;
  },
) => {
  await request(httpServer).post('/auth/registration').send({
    login: userData?.login || 'krolik',
    password: userData?.password || '123456',
    email: userData?.email || 'gagara5620@gmail.com',
  });

  const response = await request(httpServer).post('/auth/login').send({
    loginOrEmail: userData?.login || 'krolik',
    password: userData?.password || '123456',
  });

  const accessToken: string = (response.body as { accessToken: string })
    .accessToken;

  const refreshToken = response.headers['set-cookie'][0];
  return { accessToken, refreshToken };
};
