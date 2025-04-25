import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup/app.setup';

describe('Testing API (e2e)', () => {
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

  describe('DELETE /testing/all-data', () => {
    it('should clear all data', async () => {
      // Create a blog
      const createBlogResponse = await request(httpServer).post('/blogs').send({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test.com',
      });

      expect(createBlogResponse.status).toBe(201);

      // Create a user
      const createUserResponse = await request(httpServer).post('/users').send({
        login: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      });

      expect(createUserResponse.status).toBe(201);

      // Create a post
      const createPostResponse = await request(httpServer).post('/posts').send({
        title: 'Test Post',
        shortDescription: 'Test Short Description',
        content: 'Test Content',
        blogId: createBlogResponse.body.id,
      });

      expect(createPostResponse.status).toBe(201);

      // Verify data exists
      const blogsResponse = await request(httpServer).get('/blogs');
      expect(blogsResponse.body.totalCount).toBe(1);

      const usersResponse = await request(httpServer).get('/users');
      expect(usersResponse.body.totalCount).toBe(1);

      const postsResponse = await request(httpServer).get('/posts');
      expect(postsResponse.body.totalCount).toBe(1);

      // Clear all data
      const deleteResponse =
        await request(httpServer).delete('/testing/all-data');
      expect(deleteResponse.status).toBe(204);

      // Verify data is cleared
      const blogsAfterResponse = await request(httpServer).get('/blogs');
      expect(blogsAfterResponse.body.totalCount).toBe(0);

      const usersAfterResponse = await request(httpServer).get('/users');
      expect(usersAfterResponse.body.totalCount).toBe(0);

      const postsAfterResponse = await request(httpServer).get('/posts');
      expect(postsAfterResponse.body.totalCount).toBe(0);
    });
  });
});
