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
import { AdminBlogsService } from './admin.blogs.service';
import { QueryBlogsDto } from './dto/query-blogs.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BasicAuthGuard } from '../../../core/guards/basic-auth.guard';

@Controller('sa/blogs')
@UseGuards(BasicAuthGuard)
export class AdminBlogsController {
  constructor(private readonly adminBlogsService: AdminBlogsService) {}

  @Get()
  async getAllBlogs(@Query() query: QueryBlogsDto) {
    return await this.adminBlogsService.getAllBlogs(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(@Body() dto: CreateBlogDto) {
    return await this.adminBlogsService.createBlog(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    await this.adminBlogsService.updateBlog(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string) {
    await this.adminBlogsService.deleteBlog(id);
  }

  @Get(':blogId/posts')
  async getBlogPosts(
    @Param('blogId') blogId: string,
    @Query() query: QueryPostsDto,
  ) {
    return await this.adminBlogsService.getBlogPosts(blogId, query);
  }

  @Post(':blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  async createBlogPost(
    @Param('blogId') blogId: string,
    @Body() dto: CreatePostDto,
  ) {
    return await this.adminBlogsService.createBlogPost(blogId, dto);
  }

  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlogPost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    await this.adminBlogsService.updateBlogPost(blogId, postId, dto);
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlogPost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    await this.adminBlogsService.deleteBlogPost(blogId, postId);
  }
}
