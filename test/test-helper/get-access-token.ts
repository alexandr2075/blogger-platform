export const getAccessToken = async (request: any, httpServer: any) => {
  await request(httpServer).post('/auth/registration').send({
    login: 'krolik',
    password: '123456',
    email: 'gagara5620@gmail.com',
  });

  const login = await request(httpServer).post('/auth/login').send({
    loginOrEmail: 'krolik',
    password: '123456',
  });

  return login.body.accessToken;
};
