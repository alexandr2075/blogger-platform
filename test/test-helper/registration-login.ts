export const registrationAndLoginUser = async (
  request: typeof import('supertest'),
  httpServer: any,
  userData?: {
    login: string;
    password: string;
    email: string;
  },
) => {
  const registrationResponse = await request(httpServer).post('/auth/registration').send({
    login: userData?.login || 'krolik',
    password: userData?.password || '123456',
    email: userData?.email || 'gagara5620@gmail.com',
  });

  // Debug logging for registration
  console.log('Registration response status:', registrationResponse.status);
  console.log('Registration response body:', registrationResponse.body);

  const response = await request(httpServer).post('/auth/login').send({
    loginOrEmail: userData?.login || 'krolik',
    password: userData?.password || '123456',
  });

  const accessToken: string = (response.body as { accessToken: string })
    .accessToken;

  // Debug logging
  console.log('Login response status:', response.status);
  console.log('Login response body:', response.body);
  console.log('Login response headers:', response.headers);
  console.log('Set-cookie header:', response.headers['set-cookie']);

  const refreshToken = response.headers['set-cookie']?.[0];
  return { accessToken, refreshToken };
};
