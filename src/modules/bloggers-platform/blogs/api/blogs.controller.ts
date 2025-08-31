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
import { ApiBasicAuth } from '@nestjs/swagger';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { BasicAuthGuard } from '../../../../modules/users/guards/basic/basic-auth.guard';
import { GetPostsQueryParams } from '../../posts/api/get-posts-query-params.input-dto';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { PostsService } from '../../posts/application/posts.service';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { BlogsService } from '../application/blogs.service';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { GetBlogsQueryParams } from './get-blogs-query-params.input-dto';
import {
  BlogPostInputDto,
  CreateBlogInputDto,
} from './input-dto/blogs.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { BlogViewDto } from './view-dto/blogs.view-dto';
import { JwtAuthGuardForUserId } from '../../../../core/guards/jwt-auth-for-user-id.guard';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';

@ApiBasicAuth('basicAuth')
@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private blogsQueryRepository: BlogsQueryRepository,
    private postsService: PostsService,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepository.getAll(query);
  }
  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.blogsService.createBlog(body);
    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  //get POSTS by blogId
  @UseGuards(JwtAuthGuardForUserId)
  @Get(':blogId/posts')
  async getPostByBlogId(
    @Query() query: GetPostsQueryParams,
    @Param('blogId') blogId: string,
    @CurrentUser() userId: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
    query.blogId = blogId;
    return this.postsQueryRepository.getAll(query, userId);
  }

  //create new POST by blogId
  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  async createPostByBlogId(
    @Body() body: BlogPostInputDto,
    @Param('blogId') blogId: string,
  ): Promise<PostViewDto> {
    const blog = await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
    return this.postsService.createPost({ ...body, blogId: blog.id });
  }
  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    await this.blogsService.updateBlog(id, body);
  }
  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    await this.blogsService.deleteBlog(id);
  }
}
