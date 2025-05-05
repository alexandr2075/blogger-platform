import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup/app.setup';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

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

  describe('GET /users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(httpServer).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return users with pagination', async () => {
      // Create a user first
      const createResponse = await request(httpServer)
        .post('/users')
        .set(
          'Authorization',
          'Basic ' + Buffer.from('admin:qwerty').toString('base64'),
        )
        .send({
          login: 'testuser',
          password: 'password123',
          email: 'test@example.com',
        });

      expect(createResponse.status).toBe(201);

      // Get all users
      const response = await request(httpServer).get('/users');
      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(1);
      expect(response.body.items[0].login).toBe('testuser');
      expect(response.body.items[0].email).toBe('test@example.com');
      // Password should not be returned
      expect(response.body.items[0].password).toBeUndefined();
    });

    it('should return count users', async () => {
      for (let i = 1; i <= 15; i++) {
        const response = await request(httpServer)
          .post('/users')
          .set(
            'Authorization',
            'Basic ' + Buffer.from('admin:qwerty').toString('base64'),
          )
          .send({
            login: `testuser${i}`,
            password: `password${i}`,
            email: `testuser${i}@example.com`,
          });

        expect(response.status).toBe(201);
        expect(response.body.login).toBe(`testuser${i}`);
      }

      // Get all users
      const response = await request(httpServer).get('/users');
      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(15);
    });

    it('should filter users by search term', async () => {
      // Create two users
      await request(httpServer)
        .post('/users')
        .set(
          'Authorization',
          'Basic ' + Buffer.from('admin:qwerty').toString('base64'),
        )
        .send({
          login: 'firstuser',
          password: 'password123',
          email: 'first@example.com',
        });

      await request(httpServer)
        .post('/users')
        .set(
          'Authorization',
          'Basic ' + Buffer.from('admin:qwerty').toString('base64'),
        )
        .send({
          login: 'seconduser',
          password: 'password123',
          email: 'second@example.com',
        });

      // Search for "first"
      const response = await request(httpServer)
        .get('/users')
        .query({ searchLoginTerm: 'first' });

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(1);
      expect(response.body.items[0].login).toBe('firstuser');
    });
  });

  describe('GET /users/:id', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await request(httpServer)
        .get('/users/nonexistentid')
        .set(
          'Authorization',
          'Basic ' + Buffer.from('admin:qwerty').toString('base64'),
        );
      expect(response.status).toBe(404);
    });

    it('should return user by id', async () => {
      // Create a user first
      const createResponse = await request(httpServer).post('/users').send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      });

      const userId = createResponse.body.id;

      // Get user by id
      const response = await request(httpServer).get(`/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.login).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
      // Password should not be returned
      expect(response.body.password).toBeUndefined();
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await request(httpServer)
        .post('/users')
        .set(
          'Authorization',
          'Basic ' + Buffer.from('admin:qwerty').toString('base64'),
        )
        .send({
          login: 'newuser',
          password: 'password123',
          email: 'new@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.login).toBe('newuser');
      expect(response.body.email).toBe('new@example.com');
      expect(response.body.id).toBeDefined();
      // Password should not be returned
      expect(response.body.password).toBeUndefined();
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(httpServer).post('/users').send({
        // Missing required fields
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for duplicate login', async () => {
      // Create first user
      await request(httpServer).post('/users').send({
        login: 'duplicateuser',
        password: 'password123',
        email: 'first@example.com',
      });

      // Try to create user with same login
      const response = await request(httpServer).post('/users').send({
        login: 'duplicateuser',
        password: 'password123',
        email: 'second@example.com',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for duplicate email', async () => {
      // Create first user
      await request(httpServer).post('/users').send({
        login: 'firstuser',
        password: 'password123',
        email: 'duplicate@example.com',
      });

      // Try to create user with same email
      const response = await request(httpServer).post('/users').send({
        login: 'seconduser',
        password: 'password123',
        email: 'duplicate@example.com',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete an existing user', async () => {
      // Create a user first
      const createResponse = await request(httpServer).post('/users').send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      });

      const userId = createResponse.body.id;

      // Delete the user
      const deleteResponse = await request(httpServer).delete(
        `/users/${userId}`,
      );
      expect(deleteResponse.status).toBe(204);

      // Verify the deletion
      const getResponse = await request(httpServer).get(`/users/${userId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(httpServer).delete('/users/nonexistentid');
      expect(response.status).toBe(404);
    });
  });
});
