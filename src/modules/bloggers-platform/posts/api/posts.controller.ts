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
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostsService } from '../application/posts.service';
import { PostsQueryRepositoryPostgres } from '../infrastructure/posts.query-repository-postgres';
import { GetPostsQueryParams } from './get-posts-query-params.input-dto';
import { CreatePostInputDto } from './input-dto/posts.input-dto';
import { UpdatePostInputDto } from './input-dto/update-post.input-dto';
import { PostViewDto } from './view-dto/posts.view-dto';
import { LikeStatusDto } from '../dto/like-status.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { Comment } from '../../comments/domain/comment.entity';
import { GetPostCommentsQueryParams } from './get-post-comments-query-params.input-dto';
import { BasicAuthGuard } from '../../../../modules/users/guards/basic/basic-auth.guard';
import { ApiBasicAuth } from '@nestjs/swagger';
import { JwtAuthGuardForUserId } from '../../../../core/guards/jwt-auth-for-user-id.guard';
import { CommentViewDto } from '../../../bloggers-platform/comments/dto/comments.view-dto';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private postsQueryRepository: PostsQueryRepositoryPostgres,
  ) {}
  @UseGuards(JwtAuthGuardForUserId)
  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
    @CurrentUser() userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAll(query, userId);
  }
  @UseGuards(JwtAuthGuardForUserId)
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser() userId?: string,
  ): Promise<PostViewDto> {
    return await this.postsQueryRepository.getByIdOrNotFoundFail(id, userId);
  }

  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth('basicAuth')
  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewDto> {
    return await this.postsService.createPost(body);
  }

  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth('basicAuth')
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<void> {
    await this.postsService.updatePost(id, body);
  }

  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth('basicAuth')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.postsService.deletePost(id);
  }

  @Put(':postId/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('postId') postId: string,
    @Body() likeStatusDto: LikeStatusDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.postsService.updateLikeStatus(postId, likeStatusDto, userId);
  }

  @Get(':postId/comments')
  async getPostComments(
    @Param('postId') postId: string,
    @Query() query: GetPostCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    return this.postsService.getPostComments(postId, query);
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() userId: string,
  ): Promise<CommentViewDto> {
    return this.postsService.createComment(postId, userId, createCommentDto);
  }
}
