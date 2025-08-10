import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from '../../../core/database/postgres.config';
import { GetBlogsQueryParams } from '../../bloggers-platform/blogs/api/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../../bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { SortDirection } from '../../../core/dto/base.query-params.input-dto';

@Injectable()
export class AdminBlogsQueryRepository {
  constructor(private readonly postgres: PostgresService) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  private mapRow(row: any): BlogViewDto {
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
    return this.mapRow(rows[0]);
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

    const sortDir = q.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';
    const sortByKey = q.sortBy || 'createdAt';
    let sortExpression = 'created_at';
    if (sortByKey === 'name') {
      sortExpression = 'name COLLATE "C"';
    } else if (sortByKey === 'description') {
      sortExpression = 'description';
    } else if (sortByKey === 'websiteUrl') {
      sortExpression = 'website_url';
    } else if (sortByKey === 'createdAt') {
      sortExpression = 'created_at';
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const pageSize = q.pageSize ?? 10;
    const pageNumber = q.pageNumber ?? 1;
    const offset = (pageNumber - 1) * pageSize;

    const itemsQuery = `
      SELECT * FROM blogs
      ${where}
      ORDER BY ${sortExpression} ${sortDir}
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
      items: itemsRows.map((r) => this.mapRow(r)),
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }
}
