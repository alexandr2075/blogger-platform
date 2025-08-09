import { Injectable } from '@nestjs/common';
import { AdminBlogsRepository, AdminCreateBlogDto, AdminUpdateBlogDto } from './admin.blogs.repository';
import { AdminBlogsQueryRepository } from './admin.blogs.query-repository';
import { GetBlogsQueryParams } from '../../bloggers-platform/blogs/api/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../../bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { PostsRepositoryPostgres } from '../../bloggers-platform/posts/infrastructure/posts.repository-postgres';
import { PostsQueryRepositoryPostgres } from '../../bloggers-platform/posts/infrastructure/posts.query-repository-postgres';
import { PostViewDto } from '../../bloggers-platform/posts/api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../bloggers-platform/posts/api/get-posts-query-params.input-dto';

@Injectable()
export class AdminBlogsService {
  constructor(
    private readonly blogsRepo: AdminBlogsRepository,
    private readonly blogsQueryRepo: AdminBlogsQueryRepository,
    private readonly postsRepo: PostsRepositoryPostgres,
    private readonly postsQueryRepo: PostsQueryRepositoryPostgres,
  ) {}

  async getAllBlogs(query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepo.getAll(query);
  }

  async createBlog(dto: AdminCreateBlogDto): Promise<string> {
    return this.blogsRepo.create(dto);
  }

  async updateBlog(id: string, dto: AdminUpdateBlogDto): Promise<void> {
    await this.blogsRepo.update(id, dto);
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepo.delete(id);
  }

  async createPostForBlog(blogId: string, input: { title: string; shortDescription: string; content: string }): Promise<string> {
    const blog = await this.blogsRepo.getByIdOrNotFoundFail(blogId);
    return this.postsRepo.insert({
      title: input.title,
      shortDescription: input.shortDescription,
      content: input.content,
      blogId: blog.id,
      blogName: blog.name,
    });
  }

  async getPostsForBlog(blogId: string, query: GetPostsQueryParams): Promise<PaginatedViewDto<PostViewDto[]>> {
    // Ensure blog exists
    await this.blogsRepo.getByIdOrNotFoundFail(blogId);
    query.blogId = blogId;
    // Admin listing does not need user-specific likes; pass undefined userId
    return this.postsQueryRepo.getAll(query, undefined as any);
  }

  async updatePost(blogId: string, postId: string, input: { title: string; shortDescription: string; content: string }): Promise<void> {
    // Ensure blog exists (optional consistency check)
    await this.blogsRepo.getByIdOrNotFoundFail(blogId);
    await this.postsRepo.update(postId, {
      title: input.title,
      shortDescription: input.shortDescription,
      content: input.content,
    });
  }

  async deletePost(blogId: string, postId: string): Promise<void> {
    // Ensure blog exists (optional consistency check)
    await this.blogsRepo.getByIdOrNotFoundFail(blogId);
    await this.postsRepo.softDelete(postId);
  }
}
