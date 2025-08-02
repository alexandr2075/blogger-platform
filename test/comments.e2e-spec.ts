import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup/app.setup';
import { createComment } from './test-helper/create-comment';
import { EmailService } from '../src/core/email/email.service';

describe('Comments (e2e)', () => {
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

  beforeEach(async () => {
    await request(app.getHttpServer()).delete('/testing/all-data');
  });

  it('/comments/:commentId/like-status (PUT) - Should update like status', async () => {
    const { accessToken, commentId } = await createComment(request, httpServer);

    const likeStatusPayload = { likeStatus: 'Like' }; // Замените на реальные данные

    await request(app.getHttpServer())
      .put(`/comments/${commentId}/like-status`)
      .send(likeStatusPayload)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204); // Ожидаемый статус 204 No Content
  });

  it('/comments/:commentId (PUT) - Should update comment', async () => {
    const { accessToken, commentId } = await createComment(request, httpServer);
    const updatePayload = {
      content: 'This is an updated comment with at least 20 characters.',
    };

    await request(app.getHttpServer())
      .put(`/comments/${commentId}`)
      .send(updatePayload)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('/comments/:commentId (PUT) - Should get comments after like', async () => {
    const { accessToken, postId, commentId } = await createComment(
      request,
      httpServer,
    );
    const likeStatusPayload = { likeStatus: 'Like' }; // Замените на реальные данные

    await request(app.getHttpServer())
      .put(`/comments/${commentId}/like-status`)
      .send(likeStatusPayload)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204); // Ожидаемый статус 204 No Content

    await request(app.getHttpServer())
      .get(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('/comments/:commentId (PUT) - should return error if :id from uri param not found; status 404', async () => {
    const { accessToken } = await createComment(request, httpServer);
    const updatePayload = {
      content: 'This is an updated comment with at least 20 characters.',
    };

    await request(app.getHttpServer())
      .put(`/comments/63189b06003380064c4193be`)
      .send(updatePayload)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('/comments/:commentId (DELETE) - Should delete comment', async () => {
    const { accessToken, commentId } = await createComment(request, httpServer);

    await request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204); // Ожидаемый статус 204 No Content
  });

  it('/comments/:commentId (DELETE) - should return error if :id from uri param not found; status 404', async () => {
    const { accessToken } = await createComment(request, httpServer);

    await request(app.getHttpServer())
      .delete(`/comments/63189b06003380064c4193be`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it("/comments/:id (GET) - Should return comment by id by unauthorized user. Should return liked comment with 'myStatus: None'; status 204", async () => {
    const { accessToken, commentId } = await createComment(request, httpServer);

    const likeStatusPayload = { likeStatus: 'Like' }; // Замените на реальные данные

    await request(app.getHttpServer())
      .put(`/comments/${commentId}/like-status`)
      .send(likeStatusPayload)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/comments/${commentId}`)
      .expect(200) // Ожидаемый статус 200 OK
      .expect((res) => {
        expect(res.body).toHaveProperty('id', commentId);
        // expect(res.body).toHaveProperty('content');
        // expect(res.body).toHaveProperty('commentatorInfo');
        // expect(res.body).toHaveProperty('createdAt');
        expect(res.body.likesInfo.myStatus).toBe('None');
      });
  });

  it("/comments/:id (GET) - Should return comment by id by AUTHORISED user. Should return liked comment with 'myStatus: Like or Dislike'; status 204", async () => {
    const { accessToken, commentId } = await createComment(request, httpServer);

    // await request(app.getHttpServer())
    //   .get(`/comments/${commentId}`)
    //   .set('Authorization', `Bearer ${accessToken}`)
    //   .expect(200) // Ожидаемый статус 200 OK
    //   .expect((res) => {
    //     expect(res.body).toHaveProperty('id', commentId);
    //     expect(res.body).toHaveProperty('createdAt');
    //     expect(res.body.likesInfo.myStatus).toBe('None');
    //   });

    const likeStatusPayload = { likeStatus: 'Like' };

    await request(app.getHttpServer())
      .put(`/comments/${commentId}/like-status`)
      .send(likeStatusPayload)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204); // Ожидаемый статус 204 No Content

    await request(app.getHttpServer())
      .get(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200) // Ожидаемый статус 200 OK
      .expect((res) => {
        expect(res.body).toHaveProperty('id', commentId);
        expect(res.body.likesInfo.myStatus).toBe('Like');
      });

    // const DislikeStatusPayload = { likeStatus: 'Dislike' };
    //
    // await request(app.getHttpServer())
    //   .put(`/comments/${commentId}/like-status`)
    //   .send(DislikeStatusPayload)
    //   .set('Authorization', `Bearer ${accessToken}`)
    //   .expect(204); // Ожидаемый статус 204 No Content
    //
    // await request(app.getHttpServer())
    //   .get(`/comments/${commentId}`)
    //   .set('Authorization', `Bearer ${accessToken}`)
    //   .expect(200) // Ожидаемый статус 200 OK
    //   .expect((res) => {
    //     expect(res.body).toHaveProperty('id', commentId);
    //     expect(res.body.likesInfo.myStatus).toBe('Dislike');
    //   });
  });

  it('/comments/:id (GET) - Should return 404 for non-existent id', async () => {
    const nonExistentId = 'someNonExistentId'; // Замените на ID, который точно не существует

    await request(app.getHttpServer())
      .get(`/comments/${nonExistentId}`)
      .expect(404); // Ожидаемый статус 404 Not Found
  });
});
