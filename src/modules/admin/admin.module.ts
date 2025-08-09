import { Module } from '@nestjs/common';
import { PostgresService } from '../../core/database/postgres.config';
import { AdminBlogsController } from './admin-blogs/admin.blogs.controller';
import { AdminBlogsService } from './admin-blogs/admin.blogs.service';
import { AdminBlogsRepository } from './admin-blogs/admin.blogs.repository';
import { AdminBlogsQueryRepository } from './admin-blogs/admin.blogs.query-repository';
import { PostsRepositoryPostgres } from '../bloggers-platform/posts/infrastructure/posts.repository-postgres';
import { PostsQueryRepositoryPostgres } from '../bloggers-platform/posts/infrastructure/posts.query-repository-postgres';
import { BlogsQueryRepositoryPostgres } from '../bloggers-platform/blogs/infrastructure/blogs.query-repository-postgres';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-users/admin.users.controller';
import { AdminUsersService } from './admin-users/admin.users.service';
import { AdminUsersRepository } from './admin-users/admin.users.repository';

@Module({
  imports: [UsersModule],
  controllers: [AdminBlogsController, AdminUsersController],
  providers: [
    PostgresService,
    AdminBlogsService,
    AdminBlogsRepository,
    AdminBlogsQueryRepository,
    PostsRepositoryPostgres,
    PostsQueryRepositoryPostgres,
    BlogsQueryRepositoryPostgres,
    AdminUsersService,
    AdminUsersRepository,
  ],
})
export class AdminModule {}