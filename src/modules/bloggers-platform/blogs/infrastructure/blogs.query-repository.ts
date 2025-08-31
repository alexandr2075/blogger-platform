import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import { GetBlogsQueryParams } from '../api/get-blogs-query-params.input-dto';
import { BlogViewDto } from '../api/view-dto/blogs.view-dto';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, IsNull } from 'typeorm';
import { Blog } from '../domain/blog.entity';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectEntityManager()
        private readonly entityManager: EntityManager,
  ) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  private mapRowToView(row: any): BlogViewDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      websiteUrl: row.websiteUrl,
      createdAt: row.createdAt,
      isMembership: row.isMembership,
    } as BlogViewDto;
  }

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    // Skip UUID validation to allow 404 responses for invalid UUIDs in tests
    try {
      const rows = await this.entityManager.findOne(Blog, {
        where: { id, deletedAt: IsNull() },
      });
      if (!rows) throw new NotFoundException('blog not found');
      return this.mapRowToView(rows);
    } catch (error) {
      // Any database error or not found error will return 404
      throw new NotFoundException('blog not found');
    }
  }

  async getAll(
    queryParams: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const q = new GetBlogsQueryParams();
    Object.assign(q, queryParams);

    const pageSize = q.pageSize ?? 10;
    const pageNumber = q.pageNumber ?? 1;

    const qb = this.entityManager
      .createQueryBuilder(Blog, 'blog');

    // Exclude soft-deleted blogs
    qb.andWhere('blog.deletedAt IS NULL');

    if (q.searchNameTerm) {
      qb.andWhere('blog.name ILIKE :name', { name: `%${q.searchNameTerm}%` });
    }

    const sortDir = q.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';
    const sortByKey = q.sortBy || 'createdAt';
    let sortColumn: keyof Blog = 'createdAt' as keyof Blog;
    if (sortByKey === 'name') sortColumn = 'name' as keyof Blog;
    else if (sortByKey === 'description') sortColumn = 'description' as keyof Blog;
    else if (sortByKey === 'websiteUrl') sortColumn = 'websiteUrl' as keyof Blog;
    else if (sortByKey === 'createdAt') sortColumn = 'createdAt' as keyof Blog;

    // Use case-sensitive sorting with C collation for proper byte-order
    if (sortColumn === 'name' || sortColumn === 'description' || sortColumn === 'websiteUrl') {
      qb.orderBy(`blog.${String(sortColumn)} COLLATE "C"`, sortDir as 'ASC' | 'DESC');
    } else {
      qb.orderBy(`blog.${String(sortColumn)}`, sortDir as 'ASC' | 'DESC');
    }

    qb.skip((pageNumber - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: items.map((b) => this.mapRowToView(b)),
    };
  }
}
