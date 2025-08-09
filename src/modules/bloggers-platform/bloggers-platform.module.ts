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
// Comments module temporarily disabled during Postgres migration
import { User } from '../users/domain/user.entity';

@Module({
  imports: [],
  controllers: [BlogsController, PostsController],
  providers: [
    BlogsService,
    BlogsRepositoryPostgres,
    BlogsQueryRepositoryPostgres,
    PostsService,
    PostsRepositoryPostgres,
    PostsQueryRepositoryPostgres,
    { provide: PostsQueryRepository, useExisting: PostsQueryRepositoryPostgres },
    UsersQueryRepositoryPostgres,
    PostgresService,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
