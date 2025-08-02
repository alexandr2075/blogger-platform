import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup/app.setup';
import { EmailService } from '../src/core/email/email.service';
jest.mock('uuid', () => ({
  v4: () => 'cf9622e7-a391-4c9c-8357-c295550344c9',
}));
import { v4 as uuidv4 } from 'uuid';
import { registrationAndLoginUser } from './test-helper/registration-login';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  const recoveryCode = uuidv4();

  beforeAll(async () => {
    const emailServiceMock = {
      sendPasswordRecovery: jest.fn(
        async () =>
          new Promise((resolve) => setTimeout(() => resolve(true), 1000)),
      ),
      sendRegistrationConfirmation: jest.fn(
        async () => new Promise((resolve) => setTimeout(() => resolve(true))),
      ),
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data');
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      // registration and login a user
      const response = await registrationAndLoginUser(request, httpServer);

      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(httpServer).post('/auth/login').send({
        loginOrEmail: 'wronguser',
        password: 'wrongpass',
      });

      expect(response.status).toBe(401);
    });

    it('should return status code 429 if more than 5 requests on "auth/login"  were sent within 10 seconds', async () => {
      let response;
      //send 6 request on 'auth/login'
      for (let i = 1; i < 7; i++) {
        response = await request(httpServer).post('/auth/login').send({
          loginOrEmail: 'wronguser',
          password: 'wrongpass',
        });
      }
      // 6 requests should be forbidden
      expect(response.status).toBe(429);
    });
  });

  describe('POST /auth/password-recovery', () => {
    it('should send recovery code to email', async () => {
      const response = await request(httpServer)
        .post('/auth/password-recovery')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(204);
    });
  });

  describe('POST /auth/new-password', () => {
    it('should update password with recovery code', async () => {
      await request(httpServer).post('/auth/registration').send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      });

      const response1 = await request(httpServer)
        .post('/auth/password-recovery')
        .send({
          email: 'test@example.com',
        });

      expect(response1.status).toBe(204);

      const response2 = await request(httpServer)
        .post('/auth/new-password')
        .send({
          newPassword: 'newpassword123',
          recoveryCode: recoveryCode,
        });
      expect(response2.status).toBe(204);
    });

    it('should return 400 for invalid recovery code', async () => {
      const response = await request(httpServer)
        .post('/auth/new-password')
        .send({
          newPassword: 'newpassword123',
          recoveryCode: 'invalidcode',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/registration', () => {
    it('should register new user', async () => {
      const response = await request(httpServer)
        .post('/auth/registration')
        .send({
          login: 'newuser',
          password: 'password123',
          email: 'new@example.com',
        });

      expect(response.status).toBe(204);
    });

    it('should return 400 for existing user', async () => {
      // First registration
      await request(httpServer).post('/auth/registration').send({
        login: 'existinguser',
        password: 'password123',
        email: 'existing@example.com',
      });

      // Try to register with the same credentials
      const response = await request(httpServer)
        .post('/auth/registration')
        .send({
          login: 'existinguser',
          password: 'password123',
          email: 'existing@example.com',
        });

      expect(response.status).toBe(400);
    });

    it('should return status code 429 if more than 5 requests on "auth/registration" were sent within 10 seconds', async () => {
      let response;
      //send 6 request on 'auth/registration'
      for (let i = 1; i < 7; i++) {
        console.log(i, 'tick', new Date().toISOString());
        response = await request(httpServer).post('/auth/registration').send({
          login: 'user',
          password: 'password123',
          email: 'user@example.com',
        });
        console.log(i, ' after tick', new Date().toISOString());
      }
      // 6 requests should be forbidden
      expect(response.status).toBe(429);
    });
  });

  describe('POST /auth/registration-confirmation', () => {
    it('should confirm registration', async () => {
      await request(httpServer).post('/auth/registration').send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      });

      const response = await request(httpServer)
        .post('/auth/registration-confirmation')
        .send({
          code: recoveryCode,
        });

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid confirmation code', async () => {
      const response = await request(httpServer)
        .post('/auth/registration-confirmation')
        .send({
          code: 'invalidcode',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/registration-email-resending', () => {
    it('should resend confirmation email', async () => {
      // First register a user
      await request(httpServer).post('/auth/registration').send({
        login: 'resenduser',
        password: 'password123',
        email: 'resend@example.com',
      });

      const response = await request(httpServer)
        .post('/auth/registration-email-resending')
        .send({
          email: 'resend@example.com',
        });

      expect(response.status).toBe(204);
    });

    it('should return 400 for non-existing email', async () => {
      const response = await request(httpServer)
        .post('/auth/registration-email-resending')
        .send({
          email: 'nonexisting@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user info', async () => {
      // First create and login user
      await request(httpServer).post('/auth/registration').send({
        login: 'user',
        password: 'password123',
        email: 'current@example.com',
      });
      const loginResponse = await request(httpServer).post('/auth/login').send({
        loginOrEmail: 'user',
        password: 'password123',
      });

      const response = await request(httpServer)
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.login).toBe('user');
      expect(response.body.email).toBe('current@example.com');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(httpServer).get('/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should return 200 if refresh token valid', async () => {
      // registration and login of a user
      const response = await registrationAndLoginUser(request, httpServer);

      // Attempt to refresh a token
      const responseRefresh = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', response.refreshToken);

      expect(responseRefresh.status).toBe(200);
      expect(responseRefresh.body.accessToken).toBeDefined();
      expect(responseRefresh.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 if refresh token expired', async () => {
      // registration and login of a user
      const response = await registrationAndLoginUser(request, httpServer);

      // Simulate waiting for token expiration
      await new Promise((resolve) => setTimeout(resolve, 25000));

      // Attempt to refresh a token after expiration
      const expiredResponse = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', response.refreshToken);
      expect(expiredResponse.status).toBe(401);
    });

    it('should return an error if the "refresh" token has become invalid, status 401, "refreshToken" should become invalid after "/auth/refresh-token" request', async () => {
      // registration and login a user
      const user = await registrationAndLoginUser(request, httpServer);

      const refreshToken1 = user.refreshToken;

      // get a new refresh token
      const refreshToken2 = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', refreshToken1);

      //attempt to get refresh token with invalid refresh token1
      const response = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', refreshToken1);

      expect(response.status).toBe(401);
    });
  });

  describe('Post /auth/logout', () => {
    it('should return 204 if logout successful', async () => {
      // registration and login of a user
      const response = await registrationAndLoginUser(request, httpServer);

      // Attempt to logout
      const logoutResponse = await request(httpServer)
        .post('/auth/logout')
        .set('Cookie', response.refreshToken);

      expect(logoutResponse.status).toBe(204);
    });

    it('should return 401 after refresh token if logout successful', async () => {
      // registration and login of a user
      const response = await registrationAndLoginUser(request, httpServer);

      // Attempt to logout
      const logoutResponse = await request(httpServer)
        .post('/auth/logout')
        .set('Cookie', response.refreshToken);

      expect(logoutResponse.status).toBe(204);

      const refreshResponse = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', response.refreshToken);
      expect(refreshResponse.status).toBe(401);
    });

    it('"/auth/logout": should return an error if the "refresh" token has become invalid; status 401', async () => {
      // registration and login a user
      const response = await registrationAndLoginUser(request, httpServer);

      // get new refresh token
      const newResponse = await request(httpServer)
        .post('/auth/refresh-token')
        .set('Cookie', response.refreshToken);

      // Attempt to logout with old refresh token
      const logoutResponse = await request(httpServer)
        .post('/auth/logout')
        .set('Cookie', response.refreshToken);

      expect(logoutResponse.status).toBe(401);
    });
  });
});
