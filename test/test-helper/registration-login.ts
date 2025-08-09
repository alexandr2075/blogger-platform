export const registrationAndLoginUser = async (
  request: typeof import('supertest'),
  httpServer: any,
  userData?: {
    login: string;
    password: string;
    email: string;
  },
) => {
  // Generate unique data for each test to prevent conflicts
  // Use shorter IDs to meet validation requirements (login: 3-10 chars)
  const randomId = Math.floor(Math.random() * 999) + 100; // 3-digit number (100-999)
  const uniqueId = randomId.toString();
  
  const defaultUserData = {
    login: `u${uniqueId}`, // u100-u999 (4 chars, within 3-10 limit)
    password: '123456',
    email: `test${uniqueId}@example.com`,
  };
  
  const finalUserData = userData || defaultUserData;
  
  const registrationResponse = await request(httpServer).post('/auth/registration').send({
    login: finalUserData.login,
    password: finalUserData.password,
    email: finalUserData.email,
  });
  
  // Check if registration was successful
  if (registrationResponse.status !== 204) {
    throw new Error(`Registration failed with status ${registrationResponse.status}: ${JSON.stringify(registrationResponse.body)}`);
  }

  const response = await request(httpServer).post('/auth/login').send({
    loginOrEmail: finalUserData.login,
    password: finalUserData.password,
  });
  
  // Check if login was successful
  if (response.status !== 200) {
    throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.body)}`);
  }

  const accessToken: string = (response.body as { accessToken: string })
    .accessToken;
  
  // Ensure we have a valid access token
  if (!accessToken) {
    throw new Error(`No access token received. Response body: ${JSON.stringify(response.body)}`);
  }

  const refreshToken = response.headers['set-cookie']?.[0];
  return { accessToken, refreshToken };
};
