import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import {
  BlogsSortBy,
  GetBlogsQueryParams,
} from '../api/get-blogs-query-params.input-dto';
import { BlogViewDto } from '../api/view-dto/blogs.view-dto';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: BlogModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('blog not found');
    }

    const blog = await this.blogModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    queryParams: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const query = new GetBlogsQueryParams();
    Object.assign(query, queryParams);
    const filter: any = { deletedAt: null };

    if (query.searchNameTerm) {
      filter.name = { $regex: query.searchNameTerm, $options: 'i' };
    }

    if (!query.sortBy) query.sortBy = BlogsSortBy.CreatedAt;
    if (!query.sortDirection) query.sortDirection = SortDirection.Asc;
    if (!query.pageSize) query.pageSize = 10;

    const [items, totalCount] = await Promise.all([
      this.blogModel
        .find(filter)
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .exec(),
      this.blogModel.countDocuments(filter),
    ]);

    return {
      items: items.map((blog) => BlogViewDto.mapToView(blog)),
      totalCount,
      pagesCount: Math.ceil(totalCount / query.pageSize),
      page: query.pageNumber,
      pageSize: query.pageSize,
    };
  }
}
