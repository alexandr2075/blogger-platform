import { Module } from '@nestjs/common';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsService } from './blogs/application/blogs.service';
import { BlogsQueryRepositoryPostgres } from './blogs/infrastructure/blogs.query-repository-postgres';
import { BlogsRepositoryPostgres } from './blogs/infrastructure/blogs.repository-postgres';
import { PostsController } from './posts/api/posts.controller';
import { PostsService } from './posts/application/posts.service';
import { PostsQueryRepositoryPostgres } from './posts/infrastructure/posts.query-repository-postgres';
import { PostsRepositoryPostgres } from './posts/infrastructure/posts.repository-postgres';
import { PostsQueryRepository } from './posts/infrastructure/posts.query-repository';

import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { Post, PostSchema } from './posts/domain/post.entity';
import { UsersQueryRepositoryPostgres } from '../users/infrastructure/users.query-repository-postgres';
import { PostgresService } from '../../core/database/postgres.config';
import { CommentsController } from './comments/api/comments.controller';
import { CommentsServicePostgres } from './comments/application/comments.service-postgres';
import { CommentsRepositoryPostgres } from './comments/infrastructure/comments.repository-postgres';
import { CommentsQueryRepositoryPostgres } from './comments/infrastructure/comments.query-repository-postgres';
import { User } from '../users/domain/user.entity';

@Module({
  imports: [],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsService,
    BlogsRepositoryPostgres,
    BlogsQueryRepositoryPostgres,
    PostsService,
    PostsRepositoryPostgres,
    PostsQueryRepositoryPostgres,
    { provide: PostsQueryRepository, useExisting: PostsQueryRepositoryPostgres },
    CommentsServicePostgres,
    CommentsRepositoryPostgres,
    CommentsQueryRepositoryPostgres,
    UsersQueryRepositoryPostgres,
    PostgresService,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
