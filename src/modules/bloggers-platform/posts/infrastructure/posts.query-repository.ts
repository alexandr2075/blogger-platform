import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetPostsQueryParams } from '../api/get-posts-query-params.input-dto';
import { PostViewDto } from '../api/view-dto/posts.view-dto';
import { Post, PostModelType } from '../domain/post.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const post = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!post) {
      throw new NotFoundException('post not found');
    }

    return PostViewDto.mapToView(post);
  }

  async getAll(
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: any = { deletedAt: null };
    
    if (query.blogId) {
      filter.blogId = query.blogId;
    }

    const [items, totalCount] = await Promise.all([
      this.PostModel.find(filter)
        .sort({ [query.sortBy]: query.sortDirection === 'asc' ? 1 : -1 })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .exec(),
      this.PostModel.countDocuments(filter),
    ]);

    return PaginatedViewDto.mapToView({
      items: items.map(post => PostViewDto.mapToView(post)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
} 