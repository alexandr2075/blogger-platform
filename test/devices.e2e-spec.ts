import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupApp } from '@/setup/app.setup';
import { Server } from 'http';
import { registrationAndLoginUser } from './test-helper/registration-login';
import jwt from 'jsonwebtoken';

describe('Security/devices API (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  // Clear database before each test
  beforeEach(async () => {
    await request(httpServer).delete('/testing/all-data');
  });

  describe('GET /devices', () => {
    it('should return devices by userId', async () => {
      await request(httpServer).post('/auth/registration').send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      });

      const firstLoginResponse = await request(httpServer)
        .post('/auth/login')
        .set(
          'User-Agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        )
        .set('X-Forwarded-For', '192.168.1.1')
        .send({
          loginOrEmail: 'testuser',
          password: 'password123',
        });

      const secondLoginResponse = await request(httpServer)
        .post('/auth/login')
        .set(
          'User-Agent',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        )
        .set('X-Forwarded-For', '192.168.1.2')
        .send({
          loginOrEmail: 'testuser',
          password: 'password123',
        });

      // Получаем refreshToken из Set-Cookie заголовка
      const cookies = firstLoginResponse.headers['set-cookie'];
      if (cookies) {
        const response = await request(httpServer)
          .get('/security/devices')
          .set('Cookie', cookies);
        expect(response.status).toBe(200);
        response.body.forEach(device => {
          expect(device).toEqual(
            expect.objectContaining({
              deviceId: expect.any(String),
              ip: expect.any(String),
              lastActiveDate: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
              title: expect.any(String)
            })
          );
        });
      }
    });
  });

  describe('DELETE /devices/deviceId', () => {
    it('should delete device by deviceId', async () => {
      const { refreshToken } = await registrationAndLoginUser(
        request,
        httpServer,
      );

      const tokenValue = refreshToken.split(';')[0].split('=')[1];

      const payload = jwt.verify(
        tokenValue,
        process.env.REFRESH_TOKEN_SECRET || 'secretOrKey_forTest',
      ) as jwt.JwtPayload;
      const response = await request(httpServer).delete(
        `/security/devices/${payload.deviceId}`,
      );

      expect(response.status).toBe(401);
    });

    it('Should return forbidden error ; status 403, if delete the entity that was created by another user', async () => {
      const user1 = await registrationAndLoginUser(
        request,
        httpServer,
      );

      const user2 = await registrationAndLoginUser(
        request,
        httpServer,
        {
          login: 'user2',
          password: '123456',
          email: 'user2@example.com',
        },
      );

      const tokenValueUser1 = user1.refreshToken.split(';')[0].split('=')[1];
      
      const payloadUser1 = jwt.verify(
        tokenValueUser1,
        process.env.REFRESH_TOKEN_SECRET || 'secretOrKey_forTest',
      ) as jwt.JwtPayload;


      const response = await request(httpServer)
      .delete(
        `/security/devices/${payloadUser1.deviceId}`,
      )
      .set('Cookie', user2.refreshToken);


      expect(response.status).toBe(403);
    });
  });
});
