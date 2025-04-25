import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Connection, connect, connections } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { UsersRepository } from '../infrastructure/users.repository';

describe('Users E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: UsersRepository;
  let mongoConnection: Connection;

  beforeAll(async () => {
    // Подключаемся к тестовой базе данных
    await connect(process.env.MONGO_URL || 'mongodb://localhost:27017/test');
    mongoConnection = connections[0];

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
  });

  beforeEach(async () => {
    // Очищаем базу перед каждым тестом
    if (mongoConnection) {
      const collections = mongoConnection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  });

  afterAll(async () => {
    if (mongoConnection) {
      await mongoConnection.close();
    }
    if (app) {
      await app.close();
    }
  });

  describe('Auth Flow', () => {
    const testUser = {
      login: 'testuser',
      password: 'Password123!',
      email: 'test@test.com',
    };

    it('should register new user and complete full auth flow', async () => {
      // 1. Регистрация
      const registrationResponse = await request(app.getHttpServer())
        .post('/auth/registration')
        .send(testUser)
        .expect(204);

      // 2. Проверяем что нельзя войти до подтверждения
      const loginBeforeConfirmResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.email,
          password: testUser.password,
        })
        .expect(401);

      // 3. Получаем код подтверждения из базы
      const user = await usersRepository.findByEmail(testUser.email);
      if (!user || !user.EmailConfirmed.confirmationCode) {
        throw new Error('User or confirmation code not found');
      }

      // 4. Подтверждаем регистрацию
      await request(app.getHttpServer())
        .post('/auth/registration-confirmation')
        .send({ code: user.EmailConfirmed.confirmationCode })
        .expect(204);

      // 5. Теперь можем войти
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body.accessToken).toBeDefined();
      const accessToken = loginResponse.body.accessToken;

      // 6. Проверяем информацию о пользователе
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body.email).toBe(testUser.email);
      expect(meResponse.body.login).toBe(testUser.login);
    }, 10000); // увеличиваем таймаут для этого теста

    it('should not allow registration with existing email', async () => {
      // Сначала регистрируем пользователя
      await request(app.getHttpServer())
        .post('/auth/registration')
        .send(testUser)
        .expect(204);

      // Пытаемся зарегистрировать того же пользователя
      await request(app.getHttpServer())
        .post('/auth/registration')
        .send(testUser)
        .expect(400);
    });

    it('should handle password recovery flow', async () => {
      // Сначала регистрируем и подтверждаем пользователя
      await request(app.getHttpServer())
        .post('/auth/registration')
        .send(testUser)
        .expect(204);

      const user = await usersRepository.findByEmail(testUser.email);
      if (!user) {
        throw new Error('User not found');
      }

      await request(app.getHttpServer())
        .post('/auth/registration-confirmation')
        .send({ code: user.EmailConfirmed.confirmationCode })
        .expect(204);

      // 1. Запрашиваем восстановление пароля
      await request(app.getHttpServer())
        .post('/auth/password-recovery')
        .send({ email: testUser.email })
        .expect(204);

      // 2. Получаем обновленного пользователя с кодом восстановления
      const updatedUser = await usersRepository.findByEmail(testUser.email);
      if (!updatedUser || !updatedUser.EmailConfirmed.confirmationCode) {
        throw new Error('Recovery code not found');
      }

      // 3. Устанавливаем новый пароль
      const newPassword = 'NewPassword123!';
      await request(app.getHttpServer())
        .post('/auth/new-password')
        .send({
          newPassword,
          recoveryCode: updatedUser.EmailConfirmed.confirmationCode,
        })
        .expect(204);

      // 4. Проверяем вход с новым паролем
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.email,
          password: newPassword,
        })
        .expect(200);
    });
  });
}); 