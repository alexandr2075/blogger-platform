import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../api/get-blogs-query-params.input-dto';
import { BlogViewDto } from '../api/view-dto/blogs.view-dto';
import { Blog, BlogModelType } from '../domain/blog.entity';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    return BlogViewDto.mapToView(blog);
  }

  async getAll(query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: any = { deletedAt: null };
    
    if (query.searchNameTerm) {
      filter.name = { $regex: query.searchNameTerm, $options: 'i' };
    }

    const [items, totalCount] = await Promise.all([
      this.BlogModel.find(filter)
        .sort({ [query.sortBy]: query.sortDirection === 'asc' ? 1 : -1 })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .exec(),
      this.BlogModel.countDocuments(filter)
    ]);

    return {
      items: items.map(blog => BlogViewDto.mapToView(blog)),
      totalCount,
      pagesCount: Math.ceil(totalCount / query.pageSize),
      page: query.pageNumber,
      pageSize: query.pageSize,
    };
  }
} 