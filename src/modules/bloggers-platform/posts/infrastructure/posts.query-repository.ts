import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../api/get-posts-query-params.input-dto';
import { PostViewDto } from '../api/view-dto/posts.view-dto';
import { Post, PostModelType } from '../domain/post.entity';
import { Types } from 'mongoose';
import { UsersQueryRepositoryPostgres } from '../../../../modules/users/infrastructure/users.query-repository-postgres';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private usersQueryRepository: UsersQueryRepositoryPostgres,
  ) {}

  async getByIdOrNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<PostViewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('invalid post id');
    }

    const post = await this.PostModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });

    if (!post) {
      throw new NotFoundException('post not found');
    }

    return PostViewDto.mapToView(post, userId);
  }

  async getAll(
    query: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const user = userId
      ? await this.usersQueryRepository.getByIdOrNotFoundFail(userId)
      : null;

    const filter: any = { deletedAt: null };

    if (query.blogId) {
      filter.blogId = query.blogId;
    }

    const [items, totalCount] = await Promise.all([
      this.PostModel.find(filter)
        .sort({
          [query.sortBy]: query.sortDirection === SortDirection.Asc ? 1 : -1,
        })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .exec(),
      this.PostModel.countDocuments(filter),
    ]);
    return PaginatedViewDto.mapToView({
      items: items.map((post) =>
        PostViewDto.mapToView(post, userId, user?.login),
      ),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
