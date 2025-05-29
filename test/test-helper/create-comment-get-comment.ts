import request from 'supertest';

export const createComment = async (
  request: any,
  httpServer: any,
): Promise<{ accessToken: string; postId: string; userId: string, commentId: string }> => {
  try {
    const createBlogResponse = await request(httpServer)
      .post('/blogs')
      .auth('admin', 'qwerty')
      .send({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test.com',
      });

    const blogId: string = createBlogResponse.body.id;

    const createResponse = await request(httpServer)
      .post('/posts')
      .auth('admin', 'qwerty')
      .send({
        title: 'Test Post',
        shortDescription: 'Test Short Description',
        content: 'Test Content',
        blogId: blogId,
      });

    const postId: string = createResponse.body.id;

    await request(httpServer).post('/auth/registration').send({
      login: 'krolik',
      password: '123456',
      email: 'gagara5620@gmail.com',
    });

    const login = await request(httpServer).post('/auth/login').send({
      loginOrEmail: 'krolik',
      password: '123456',
    });

    const me = await request(httpServer)
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    const createComment = await request(httpServer)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        content: 'TestContentLonger20MustBe',
      });

    return {
      accessToken: login.body.accessToken,
      postId: createResponse.body.id,
      userId: me.body.userId,
      commentId: createComment.body._id.toString(),
    };
  } catch (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }
};
