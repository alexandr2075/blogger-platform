import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup/app.setup';

describe('Posts API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let blogId: string;

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

    // Create a blog for post tests
    const createBlogResponse = await request(httpServer).post('/blogs').send({
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test.com',
    });

    blogId = createBlogResponse.body.id;
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
      // Create a post first
      const createResponse = await request(httpServer).post('/posts').send({
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
      // Create a post first
      const createResponse = await request(httpServer).post('/posts').send({
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
      const response = await request(httpServer).post('/posts').send({
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
      const response = await request(httpServer).post('/posts').send({
        // Missing required fields
      });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent blog', async () => {
      const response = await request(httpServer).post('/posts').send({
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
      // Create a post first
      const createResponse = await request(httpServer).post('/posts').send({
        title: 'Test Post',
        shortDescription: 'Test Short Description',
        content: 'Test Content',
        blogId: blogId,
      });

      const postId = createResponse.body.id;

      // Update the post
      const updateResponse = await request(httpServer)
        .put(`/posts/${postId}`)
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
      const response = await request(httpServer)
        .put('/posts/nonexistentid')
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
      // Create a post first
      const createResponse = await request(httpServer).post('/posts').send({
        title: 'Test Post',
        shortDescription: 'Test Short Description',
        content: 'Test Content',
        blogId: blogId,
      });

      const postId = createResponse.body.id;

      // Delete the post
      const deleteResponse = await request(httpServer).delete(
        `/posts/${postId}`,
      );
      expect(deleteResponse.status).toBe(204);

      // Verify the deletion
      const getResponse = await request(httpServer).get(`/posts/${postId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(httpServer).delete('/posts/nonexistentid');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /blogs/:blogId/posts', () => {
    it('should create a new post for a specific blog', async () => {
      const response = await request(httpServer)
        .post(`/blogs/${blogId}/posts`)
        .send({
          title: 'Blog-specific Post',
          shortDescription: 'Blog-specific Short Description',
          content: 'Blog-specific Content',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Blog-specific Post');
      expect(response.body.shortDescription).toBe(
        'Blog-specific Short Description',
      );
      expect(response.body.content).toBe('Blog-specific Content');
      expect(response.body.blogId).toBe(blogId);
      expect(response.body.id).toBeDefined();
    });

    it('should return 404 for non-existent blog', async () => {
      const response = await request(httpServer)
        .post('/blogs/nonexistentblogid/posts')
        .send({
          title: 'Blog-specific Post',
          shortDescription: 'Blog-specific Short Description',
          content: 'Blog-specific Content',
        });

      expect(response.status).toBe(404);
    });
  });
});
