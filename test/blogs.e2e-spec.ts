import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup/app.setup';


describe('Blogs API (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    httpServer = app.getHttpServer();
    await request(httpServer).delete('/testing/all-data');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /blogs', () => {
    it('should return empty array when no blogs exist', async () => {
      const response = await request(httpServer).get('/blogs');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return blogs with pagination', async () => {
      // Create a blog first
      const createResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });

      expect(createResponse.status).toBe(201);

      // Get all blogs
      const response = await request(httpServer).get('/blogs');

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(1);
      expect(response.body.items[0].name).toBe('Test Blog');
      expect(response.body.items[0].description).toBe('Test Description');
      expect(response.body.items[0].websiteUrl).toBe('https://test.com');
    });

    it('should filter blogs by search term', async () => {
      // Create two blogs
      await request(app.getHttpServer()).post('/blogs')
      .auth('admin', 'qwerty')
      .send({
        name: 'First Blog',
        description: 'First Description',
        websiteUrl: 'https://first.com',
      });

      await request(httpServer).post('/blogs')
      .auth('admin', 'qwerty')
      .send({
        name: 'Second Blog',
        description: 'Second Description',
        websiteUrl: 'https://second.com',
      });

      // Search for "First"
      const response = await request(httpServer)
        .get('/blogs')
        .query({ searchNameTerm: 'First' });

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(1);
      expect(response.body.items[0].name).toBe('First Blog');
    });
  });

  describe('GET /blogs/:id', () => {
    it('should return 404 for non-existent blog', async () => {
      const response = await request(httpServer).get('/blogs/nonexistentid');
      expect(response.status).toBe(404);
    });

    it('should return blog by id', async () => {
      // Create a blog first
      const createResponse = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test.com',
        });

      const blogId = createResponse.body.id;

      // Get blog by id
      const response = await request(httpServer).get(
        `/blogs/${blogId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Blog');
      expect(response.body.description).toBe('Test Description');
      expect(response.body.websiteUrl).toBe('https://test.com');
    });
  });

  describe('POST /blogs', () => {
    it('should create a new blog', async () => {
      const response = await request(httpServer).post('/blogs')
      .auth('admin', 'qwerty')
      .send({
        name: 'New Blog',
        description: 'New Description',
        websiteUrl: 'https://new.com',
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Blog');
      expect(response.body.description).toBe('New Description');
      expect(response.body.websiteUrl).toBe('https://new.com');
      expect(response.body.id).toBeDefined();
    });

      it('should return 400 for invalid input', async () => {
        const response = await request(httpServer).post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          // Missing required fields
        });
    
        expect(response.status).toBe(400);
      });
    });

    describe('PUT /blogs/:id', () => {
      it('should update an existing blog', async () => {
        // Create a blog first
        const createResponse = await request(httpServer)
          .post('/blogs')
          .auth('admin', 'qwerty')
          .send({
            name: 'Test Blog',
            description: 'Test Description',
            websiteUrl: 'https://test.com',
          });

        const blogId = createResponse.body.id;

        // Update the blog
        const updateResponse = await request(httpServer)
          .put(`/blogs/${blogId}`)
          .auth('admin', 'qwerty')
          .send({
            name: 'Updated Blog',
            description: 'Updated Description',
            websiteUrl: 'https://updated.com',
          });

        expect(updateResponse.status).toBe(204);

        // Verify the update
        const getResponse = await request(httpServer).get(
          `/blogs/${blogId}`,
        );

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.name).toBe('Updated Blog');
        expect(getResponse.body.description).toBe('Updated Description');
        expect(getResponse.body.websiteUrl).toBe('https://updated.com');
      });

      it('should return 404 for non-existent blog', async () => {
        const response = await request(app.getHttpServer())
          .put('/blogs/nonexistentid')
          .auth('admin', 'qwerty')
          .send({
            name: 'Updated Blog',
            description: 'Updated Description',
            websiteUrl: 'https://updated.com',
          });
      
        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /blogs/:id', () => {
      it('should delete an existing blog', async () => {
        // Create a blog first
        const createResponse = await request(httpServer)
          .post('/blogs')
          .auth('admin', 'qwerty')
          .send({
            name: 'Test Blog',
            description: 'Test Description',
            websiteUrl: 'https://test.com',
          });

        const blogId = createResponse.body.id;

        // Delete the blog
        const deleteResponse = await request(httpServer)
        .delete(
          `/blogs/${blogId}`,
        )
        .auth('admin', 'qwerty');
        expect(deleteResponse.status).toBe(204);

        // Verify the deletion
        const getResponse = await request(httpServer).get(
          `/blogs/${blogId}`,
        );
        expect(getResponse.status).toBe(404);
      });

      it('should return 404 for non-existent blog', async () => {
        const response = await request(app.getHttpServer())
        .delete('/blogs/nonexistentid')
        .auth('admin', 'qwerty');
        expect(response.status).toBe(404);
      });
    });
  

  describe('POST /blogs/blogId/posts', () => {
    it('should create a new post with blogId', async () => {
      const responseBlog = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'New Blog',
          description: 'New Description',
          websiteUrl: 'https://new.com',
        });
      const responsePost = await request(httpServer)
        .post('/posts')
        .auth('admin', 'qwerty')
        .send({
          title: 'New Post',
          shortDescription: 'New Short Description',
          content: 'New Content',
          blogId: responseBlog.body.id,
        });

      expect(responsePost.status).toBe(201);
      expect(responsePost.body.title).toBe('New Post');
      expect(responsePost.body.shortDescription).toBe('New Short Description');
      expect(responsePost.body.content).toBe('New Content');
      expect(responsePost.body.blogId).toBe(responseBlog.body.id);
      expect(responsePost.body.id).toBeDefined();
    });

    it('should return array posts by blogId', async () => {
      const responseBlog1 = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'New Blog1',
          description: 'New Description1',
          websiteUrl: 'https://new1.com',
        });

      const responseBlog2 = await request(httpServer)
        .post('/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'New Blog2',
          description: 'New Description2',
          websiteUrl: 'https://new2.com',
        });

      const response = await request(httpServer).get('/blogs');
      expect(response.status).toBe(200);
      expect(response.body.items[0].name).toEqual('New Blog2');
      expect(response.body.items[1].name).toEqual('New Blog1');
    });
  });
});
