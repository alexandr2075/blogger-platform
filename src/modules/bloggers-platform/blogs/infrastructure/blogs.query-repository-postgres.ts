import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import { GetBlogsQueryParams } from '../api/get-blogs-query-params.input-dto';
import { BlogViewDto } from '../api/view-dto/blogs.view-dto';
import { PostgresService } from '../../../../core/database/postgres.config';

@Injectable()
export class BlogsQueryRepositoryPostgres {
  constructor(private readonly postgres: PostgresService) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  private mapRowToView(row: any): BlogViewDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      websiteUrl: row.website_url,
      createdAt: row.created_at,
      isMembership: row.is_membership,
    } as BlogViewDto;
  }

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    if (!this.isUuid(id)) throw new NotFoundException('blog not found');

    const rows = await this.postgres.query(
      `SELECT * FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('blog not found');
    return this.mapRowToView(rows[0]);
  }

  async getAll(
    queryParams: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const q = new GetBlogsQueryParams();
    Object.assign(q, queryParams);

    const filters: string[] = ['deleted_at IS NULL'];
    const values: any[] = [];

    if (q.searchNameTerm) {
      values.push(`%${q.searchNameTerm}%`);
      filters.push(`name ILIKE $${values.length}`);
    }

    const sortMap: Record<string, string> = {
      createdAt: 'created_at',
      name: 'name',
      description: 'description',
      websiteUrl: 'website_url',
    };
    const sortBy = sortMap[q.sortBy || 'createdAt'] || 'created_at';
    const sortDir = q.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const pageSize = q.pageSize ?? 10;
    const pageNumber = q.pageNumber ?? 1;
    const offset = (pageNumber - 1) * pageSize;

    const itemsQuery = `
      SELECT * FROM blogs
      ${where}
      ORDER BY ${sortBy} ${sortDir}
      OFFSET $${values.length + 1}
      LIMIT $${values.length + 2}
    `;
    const countQuery = `SELECT COUNT(*)::int AS count FROM blogs ${where}`;

    const [itemsRows, countRows] = await Promise.all([
      this.postgres.query(itemsQuery, [...values, offset, pageSize]),
      this.postgres.query(countQuery, values),
    ]);

    const totalCount = countRows[0]?.count ?? 0;

    return {
      items: itemsRows.map((r) => this.mapRowToView(r)),
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }
}
