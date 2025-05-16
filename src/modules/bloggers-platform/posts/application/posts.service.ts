import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs.query-repository';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostInputDto } from '../api/input-dto/posts.input-dto';
import { UpdatePostInputDto } from '../api/input-dto/update-post.input-dto';
import { Post, PostModelType } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { LikeStatusDto, LikeStatusEnum } from '../dto/like-status.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { Comment, CommentModelType } from '../../comments/domain/comment.entity';
import { Model, Types } from 'mongoose';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { GetPostCommentsQueryParams } from '../api/get-post-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostsQueryRepository } from '../infrastructure/posts.query-repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private postsRepository: PostsRepository,
    private postsQueryRepository: PostsQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<PostViewDto> {
    const blog = await this.blogsQueryRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );
    const post = this.PostModel.createInstance({ ...dto, blogName: blog.name });
    await this.postsRepository.save(post);
    return PostViewDto.mapToView(post);
  }

  async updatePost(id: string, dto: UpdatePostInputDto): Promise<void> {
    const post = await this.postsRepository.findNonDeletedOrNotFoundFail(id);
    post.update(dto);
    await this.postsRepository.save(post);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.postsRepository.findNonDeletedOrNotFoundFail(id);
    await this.PostModel.findOneAndUpdate(
      { _id: post._id, __v: post.__v },
      { deletedAt: new Date() }
    );
  }

  async updateLikeStatus(postId: string, likeStatusDto: LikeStatusDto, userId: string): Promise<void> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const post = await this.postsRepository.findNonDeletedOrNotFoundFail(postId);
    const user = await this.usersQueryRepository.getByIdOrNotFoundFail(userId);

    const singleLike = {
      addedAt: new Date(),
      userId,
      login: user.login,
    };

    // Сначала удаляем старые записи о лайках пользователя
    await this.PostModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      {
        $pull: {
          'likesCountArray': userId,
          'dislikesCountArray': userId,
          'extendedLikesInfo.newestLikes': { userId: userId }
        }
      }
    );

    // Затем добавляем новый статус
    const updateQuery: any = {};
    
    switch (likeStatusDto.likeStatus) {
      case LikeStatusEnum.Like:
        updateQuery.$push = {
          'extendedLikesInfo.newestLikes': {
            $each: [singleLike],
            $slice: -3
          }
        };
        updateQuery.$addToSet = { 'likesCountArray': userId };
        break;
      case LikeStatusEnum.Dislike:
        updateQuery.$addToSet = { 'dislikesCountArray': userId };
        break;
      case LikeStatusEnum.None:
        break;
    }

    if (Object.keys(updateQuery).length > 0) {
      await this.PostModel.updateOne(
        { _id: new Types.ObjectId(postId) },
        updateQuery
      );
    }
  }

  async getPostComments(postId: string, query: GetPostCommentsQueryParams): Promise<PaginatedViewDto<Comment[]>> {
    const post = await this.postsRepository.findNonDeletedOrNotFoundFail(postId);
    
    const [comments, totalCount] = await Promise.all([
      this.CommentModel.find({ postId })
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .exec(),
      this.CommentModel.countDocuments({ postId })
    ]);

    return PaginatedViewDto.mapToView({
      items: comments,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount
    });
  }

  async createComment(postId: string, userId: string, dto: CreateCommentDto): Promise<Comment> {
    const post = await this.postsRepository.findNonDeletedOrNotFoundFail(postId);
    const user = await this.usersQueryRepository.getByIdOrNotFoundFail(userId);
    
    const comment = this.CommentModel.createInstance({
      content: dto.content,
      userId: userId,
      userLogin: user.login,
      postId: postId,
    });

    return comment.save();
  }
}
