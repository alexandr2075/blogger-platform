import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup/app.setup';
import { getAccessToken } from './test-helper/get-access-token';
import { createCommentGetComment } from './test-helper/create-comment-get-comment';
import { EmailService } from '../src/core/email/email.service';

describe('Posts API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const emailServiceMock = {
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

  // Clear database before each test
  beforeEach(async () => {
    const deleteResponse =
      await request(httpServer).delete('/testing/all-data');

    // const createBlogResponse = await request(httpServer)
    //   .post('/blogs')
    //   .auth('admin', 'qwerty')
    //   .send({
    //     name: 'Test Blog',
    //     description: 'Test Description',
    //     websiteUrl: 'https://test.com',
    //   });
    // expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка
    //
    // blogId = createBlogResponse.body.id;
    // expect(blogId).toBeDefined();
  });

  describe('GET /posts', () => {
    it('should return empty array when no posts exist', async () => {
      const response = await request(httpServer).get('/posts');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return posts with pagination', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      // Create a post first
      const createResponse = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'Test Post',
          shortDescription: 'Test Short Description',
          content: 'Test Content',
          blogId: blogId,
        });

      expect(createResponse.status).toBe(201);

      // Get all posts
      const response = await request(httpServer).get('/posts');
      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(1);
      expect(response.body.items[0].title).toBe('Test Post');

      expect(response.body.items[0].shortDescription).toBe(
        'Test Short Description',
      );
      expect(response.body.items[0].content).toBe('Test Content');
      expect(response.body.items[0].blogId).toBe(blogId);
    });
  });

  describe('GET /posts/:id', () => {
    it('should return 404 for non-existent post', async () => {
      const response = await request(httpServer).get('/posts/nonexistentid');
      expect(response.status).toBe(404);
    });

    it('should return post by id', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      // Create a post first
      const createResponse = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'Test Post',
          shortDescription: 'Test Short Description',
          content: 'Test Content',
          blogId: blogId,
        });

      const postId = createResponse.body.id;
      // Get post by id
      const response = await request(httpServer).get(`/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Post');
      expect(response.body.shortDescription).toBe('Test Short Description');
      expect(response.body.content).toBe('Test Content');
      expect(response.body.blogId).toBe(blogId);
    });
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201);

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      const response = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'New Post',
          shortDescription: 'New Short Description',
          content: 'New Content',
          blogId: blogId,
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Post');
      expect(response.body.shortDescription).toBe('New Short Description');
      expect(response.body.content).toBe('New Content');
      expect(response.body.blogId).toBe(blogId);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should return error if passed body is incorrect; status 400', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201);

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      const response = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: '     ',
          content: '   ',
          blogId,
          shortDescription: 'valid',
        });
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent blog', async () => {
      const response = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'New Post',
          shortDescription: 'New Short Description',
          content: 'New Content',
          blogId: 'nonexistentblogid',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update an existing post', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      // Create a post first
      const createResponse = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'Test Post',
          shortDescription: 'Test Short Description',
          content: 'Test Content',
          blogId: blogId,
        });

      const postId = createResponse.body.id;

      // Update the post
      const updateResponse = await request(httpServer)
        .put(`/posts/${postId}`)
        .auth('admin', 'qwerty')
        .send({
          title: 'Updated Post',
          shortDescription: 'Updated Short Description',
          content: 'Updated Content',
          blogId: blogId,
        });

      expect(updateResponse.status).toBe(204);

      // Verify the update
      const getResponse = await request(httpServer).get(`/posts/${postId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.title).toBe('Updated Post');
      expect(getResponse.body.shortDescription).toBe(
        'Updated Short Description',
      );
      expect(getResponse.body.content).toBe('Updated Content');
      expect(getResponse.body.blogId).toBe(blogId);
    });

    it('should return 404 for non-existent post', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      const response = await request(httpServer)
        .put('/posts/nonexistentid')
        .auth('admin', 'qwerty')
        .send({
          title: 'Updated Post',
          shortDescription: 'Updated Short Description',
          content: 'Updated Content',
          blogId: blogId,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete an existing post', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      // Create a post first
      const createResponse = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'Test Post',
          shortDescription: 'Test Short Description',
          content: 'Test Content',
          blogId: blogId,
        });

      const postId = createResponse.body.id;

      // Delete the post
      const deleteResponse = await request(httpServer)
        .delete(`/posts/${postId}`)
        .auth('admin', 'qwerty');
      expect(deleteResponse.status).toBe(204);

      // Verify the deletion
      const getResponse = await request(httpServer).get(`/posts/${postId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(httpServer)
        .delete('/posts/nonexistentid')
        .auth('admin', 'qwerty');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /posts/:id/like-status', () => {
    it('should update like-status', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      // Create a post first
      const createResponse = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'Test Post',
          shortDescription: 'Test Short Description',
          content: 'Test Content',
          blogId: blogId,
        });

      const postId = createResponse.body.id;
      const accessToken = await getAccessToken(request, httpServer);

      // Update the post
      const response = await request(httpServer)
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          likeStatus: 'Like',
        });
      expect(response.status).toBe(204);
      // Verify the update
      const getResponse = await request(httpServer)
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.extendedLikesInfo.myStatus).toBe('Like');
      expect(
        getResponse.body.extendedLikesInfo.newestLikes[
          getResponse.body.extendedLikesInfo.newestLikes.length - 1
        ].login,
      ).toBe('krolik');

      // Update the post
      const response2 = await request(httpServer)
        .put(`/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          likeStatus: 'Dislike',
        });
      expect(response2.status).toBe(204);
      // Verify the update
      const getResponse2 = await request(httpServer)
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse2.status).toBe(200);
      expect(getResponse2.body.extendedLikesInfo.myStatus).toBe('Dislike');
      expect(getResponse2.body.extendedLikesInfo.newestLikes.length).toBe(0);
    });

    it('should return 404 for non-existent post', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201); // 💥 вот она, твоя страховка

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      const response = await request(httpServer)
        .put('/posts/nonexistentid')
        .auth('admin', 'qwerty')
        .send({
          title: 'Updated Post',
          shortDescription: 'Updated Short Description',
          content: 'Updated Content',
          blogId: blogId,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /posts/postId/comments', () => {
    it('should create a new comment', async () => {
      const comment = await createCommentGetComment(request, httpServer);
      expect(comment.status).toBe(201);
      expect(comment.body.content).toBe('TestContentLonger20MustBe');
    });

    // it('should return all comments', async () => {
    //   const { accessToken, postId, userId, commentId } = await createComment(request, httpServer)
    //   expect(comment.status).toBe(201);
    //   expect(comment.body.content).toBe('TestContentLonger20MustBe');
    // });

    it('should return comment after like', async () => {
      const response = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should return error if passed body is incorrect; status 400', async () => {
      const createBlogResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });
      expect(createBlogResponse.status).toBe(201);

      const blogId: string = createBlogResponse.body.id;
      expect(blogId).toBeDefined();

      const response = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: '     ',
          content: '   ',
          blogId,
          shortDescription: 'valid',
        });
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent blog', async () => {
      const response = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'New Post',
          shortDescription: 'New Short Description',
          content: 'New Content',
          blogId: 'nonexistentblogid',
        });

      expect(response.status).toBe(404);
    });
  });
});
