import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs.query-repository';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostInputDto } from '../api/input-dto/posts.input-dto';
import { UpdatePostInputDto } from '../api/input-dto/update-post.input-dto';
import { LikeStatusDto, LikeStatusEnum } from '../dto/like-status.dto';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { PostsRepository } from '../infrastructure/posts.repository';
import { PostsQueryRepository } from '../infrastructure/posts.query-repository';
import { GetPostCommentsQueryParams } from '../api/get-post-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../../comments/dto/comments.view-dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CommentsRepository } from '../../comments/infrastructure/comments.repository';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    private postsQueryRepository: PostsQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
    private usersQueryRepository: UsersQueryRepository,
    private commentsRepository: CommentsRepository,
    private commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<PostViewDto> {
    const blog = await this.blogsQueryRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );
    const postId = await this.postsRepository.insert({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
    });
    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  async updatePost(id: string, dto: UpdatePostInputDto): Promise<void> {
    await this.postsRepository.update(id, {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
    });
  }

  async deletePost(id: string): Promise<void> {
    await this.postsRepository.softDelete(id);
  }

  async updateLikeStatus(
    postId: string,
    likeStatusDto: LikeStatusDto,
    userId: string,
  ): Promise<void> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    await this.postsRepository.findNonDeletedOrNotFoundFail(postId);
    await this.postsRepository.upsertLike(
      postId,
      userId,
      likeStatusDto.likeStatus,
    );
  }

  async getPostComments(
    postId: string,
    query: GetPostCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    // Ensure post exists
    await this.postsRepository.findOrNotFoundFail(postId);
    return this.commentsQueryRepository.getAllByPostId(postId, query, userId);
  }

  async createComment(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentViewDto> {
    // Ensure post exists
    await this.postsRepository.findOrNotFoundFail(postId);
    
    // Get user login
    const user = await this.usersQueryRepository.getOneById(userId);
    
    const commentId = await this.commentsRepository.insert({
      content: dto.content,
      userId,
      userLogin: user.login,
      postId,
    });
    
    return this.commentsQueryRepository.getByIdOrNotFoundFail(commentId, userId);
  }
}
