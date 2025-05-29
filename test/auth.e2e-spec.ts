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

describe('Auth API (e2e)', () => {
  //   jest.setTimeout(30000);;
  let app: INestApplication;
  let httpServer: any;
  const recoveryCode = uuidv4();

  beforeAll(async () => {
    const emailServiceMock = {
      sendPasswordRecovery: jest.fn(),
      sendRegistrationConfirmation: jest.fn(),
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
      // First create a user
      await request(httpServer).post('/auth/registration').send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      });

      const response = await request(httpServer).post('/auth/login').send({
        loginOrEmail: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(httpServer).post('/auth/login').send({
        loginOrEmail: 'wronguser',
        password: 'wrongpass',
      });

      expect(response.status).toBe(401);
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

      // Try to register with same credentials
      const response = await request(httpServer)
        .post('/auth/registration')
        .send({
          login: 'existinguser',
          password: 'password123',
          email: 'existing@example.com',
        });

      expect(response.status).toBe(400);
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
      const reg = await request(httpServer).post('/auth/registration').send({
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
});
