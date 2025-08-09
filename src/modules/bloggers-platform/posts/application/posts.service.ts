import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsQueryRepositoryPostgres } from '../../blogs/infrastructure/blogs.query-repository-postgres';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostInputDto } from '../api/input-dto/posts.input-dto';
import { UpdatePostInputDto } from '../api/input-dto/update-post.input-dto';
import { LikeStatusDto, LikeStatusEnum } from '../dto/like-status.dto';
import { UsersQueryRepositoryPostgres } from '../../../users/infrastructure/users.query-repository-postgres';
import { PostsRepositoryPostgres } from '../infrastructure/posts.repository-postgres';
import { PostsQueryRepositoryPostgres } from '../infrastructure/posts.query-repository-postgres';
import { GetPostCommentsQueryParams } from '../api/get-post-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../../comments/dto/comments.view-dto';
import { CreateCommentDto } from '../dto/create-comment.dto';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepositoryPostgres,
    private postsQueryRepository: PostsQueryRepositoryPostgres,
    private blogsQueryRepository: BlogsQueryRepositoryPostgres,
    private usersQueryRepository: UsersQueryRepositoryPostgres,
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
    const user = await this.usersQueryRepository.getByIdOrNotFoundFail(userId);
    await this.postsRepository.upsertLike(
      postId,
      userId,
      likeStatusDto.likeStatus,
    );
  }

  async getPostComments(
    postId: string,
    query: GetPostCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    throw new NotFoundException('Comments are not available');
  }

  async createComment(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentViewDto> {
    throw new NotFoundException('Comments are not available');
  }
}
