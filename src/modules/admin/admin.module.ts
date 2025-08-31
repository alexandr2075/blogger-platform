import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsRepository } from '../bloggers-platform/posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../bloggers-platform/posts/infrastructure/posts.query-repository';
import { BlogsQueryRepository } from '../bloggers-platform/blogs/infrastructure/blogs.query-repository';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-users/admin.users.controller';
import { AdminUsersService } from './admin-users/admin.users.service';
import { AdminUsersRepository } from './admin-users/admin.users.repository';
import { AdminBlogsController } from './admin-blogs/admin.blogs.controller';
import { AdminBlogsService } from './admin-blogs/admin.blogs.service';
import { AdminBlogsRepository } from './admin-blogs/admin.blogs.repository';
import { Blog } from '../bloggers-platform/blogs/domain/blog.entity';
import { Post } from '../bloggers-platform/posts/domain/post.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Blog, Post])
  ],
  controllers: [AdminUsersController, AdminBlogsController],
  providers: [
    PostsRepository,
    PostsQueryRepository,
    BlogsQueryRepository,
    AdminUsersService,
    AdminUsersRepository,
    AdminBlogsService,
    AdminBlogsRepository,
  ],
})
export class AdminModule {}