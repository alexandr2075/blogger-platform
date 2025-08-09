import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { BasicAuthGuard } from '../../users/guards/basic/basic-auth.guard';
import { AdminBlogsService } from './admin.blogs.service';
import { GetBlogsQueryParams } from '../../bloggers-platform/blogs/api/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../../bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { CreateBlogInputDto, BlogPostInputDto } from '../../bloggers-platform/blogs/api/input-dto/blogs.input-dto';
import { UpdateBlogInputDto } from '../../bloggers-platform/blogs/api/input-dto/update-blog.input-dto';
import { PostViewDto } from '../../bloggers-platform/posts/api/view-dto/posts.view-dto';
import { PostsQueryRepositoryPostgres } from '../../bloggers-platform/posts/infrastructure/posts.query-repository-postgres';
import { AdminBlogsQueryRepository } from './admin.blogs.query-repository';

@ApiTags('admin-blogs')
@ApiBasicAuth('basicAuth')
@UseGuards(BasicAuthGuard)
@Controller('sa/blogs')
export class AdminBlogsController {
  constructor(
    private readonly service: AdminBlogsService,
    private readonly postsQuery: PostsQueryRepositoryPostgres,
    private readonly blogsQuery: AdminBlogsQueryRepository,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.service.getAllBlogs(query);
  }

  @Post()
  async create(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
    const id = await this.service.createBlog({
      name: body.name,
      description: body.description,
      websiteUrl: body.websiteUrl,
    });
    return this.blogsQuery.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    await this.service.updateBlog(id, {
      name: body.name,
      description: body.description,
      websiteUrl: body.websiteUrl,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.deleteBlog(id);
  }

  @Post(':blogId/posts')
  async createPost(
    @Param('blogId') blogId: string,
    @Body() body: BlogPostInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.service.createPostForBlog(blogId, body);
    return this.postsQuery.getByIdOrNotFoundFail(postId);
  }

  @Get(':blogId/posts')
  async getPosts(
    @Param('blogId') blogId: string,
    @Query() query,
  ) {
    return this.service.getPostsForBlog(blogId, query);
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() body: BlogPostInputDto,
  ): Promise<void> {
    await this.service.updatePost(blogId, postId, body);
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    await this.service.deletePost(blogId, postId);
  }
}
