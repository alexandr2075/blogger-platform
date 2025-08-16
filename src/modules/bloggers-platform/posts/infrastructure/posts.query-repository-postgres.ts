import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from '../../../../core/database/postgres.config';
import { GetPostsQueryParams, PostsSortBy } from '../api/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../api/view-dto/posts.view-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';

@Injectable()
export class PostsQueryRepositoryPostgres {
  constructor(private readonly postgres: PostgresService) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  private mapRow(row: any, userId?: string): PostViewDto {
    const myStatus = row.my_status ?? 'None';
    let newestLikes: any[] = [];
    
    // Parse newest likes if they exist
    if (row.newest_likes && row.newest_likes !== null) {
      try {
        const parsed = typeof row.newest_likes === 'string' 
          ? JSON.parse(row.newest_likes) 
          : row.newest_likes;
        newestLikes = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        newestLikes = [];
      }
    }
    
    return {
      id: row.id,
      title: row.title,
      shortDescription: row.short_description,
      content: row.content,
      blogId: row.blog_id,
      blogName: row.blog_name,
      createdAt: row.created_at,
      extendedLikesInfo: {
        likesCount: Number(row.likes_count) || 0,
        dislikesCount: Number(row.dislikes_count) || 0,
        myStatus: myStatus,
        newestLikes: newestLikes,
      },
    } as any;
  }

  async getByIdOrNotFoundFail(id: string, userId?: string): Promise<PostViewDto> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const values: any[] = [id];
    const myUser = userId && this.isUuid(userId) ? userId : null;

    const row = (
      await this.postgres.query(
        `SELECT p.*,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.status = 'Like') AS likes_count,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.status = 'Dislike') AS dislikes_count,
                ${myUser ? `(
                  SELECT status FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $2
                )` : `'None'`} AS my_status,
                (SELECT JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'addedAt', likes_data.added_at,
                    'userId', likes_data.user_id,
                    'login', likes_data.login
                  ) ORDER BY likes_data.added_at DESC
                ) FROM (
                  SELECT pl.added_at, pl.user_id, u.login 
                  FROM post_likes pl 
                  JOIN users u ON u.id = pl.user_id 
                  WHERE pl.post_id = p.id AND pl.status = 'Like' 
                  ORDER BY pl.added_at DESC 
                  LIMIT 3
                ) likes_data) AS newest_likes
         FROM posts p
         WHERE p.id = $1 AND p.deleted_at IS NULL`,
        myUser ? [id, myUser] : [id],
      )
    )[0];
    if (!row) throw new NotFoundException('post not found');
    return this.mapRow(row, userId || undefined);
  }

  async getAll(
    queryParams: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const q = new GetPostsQueryParams();
    Object.assign(q, queryParams);

    const filters: string[] = ['p.deleted_at IS NULL'];
    const values: any[] = [];

    if (q.blogId) {
      values.push(q.blogId);
      filters.push(`p.blog_id = $${values.length}`);
    }

    const sortMap: Record<string, string> = {
      [PostsSortBy.Title]: 'p.title',
      [PostsSortBy.ShortDescription]: 'p.short_description',
      [PostsSortBy.Content]: 'p.content',
      [PostsSortBy.BlogId]: 'p.blog_id',
      [PostsSortBy.BlogName]: 'p.blog_name',
      [PostsSortBy.CreatedAt]: 'p.created_at',
    };
    const sortBy = sortMap[q.sortBy] || 'p.created_at';
    const sortDir = q.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const pageSize = q.pageSize ?? 10;
    const pageNumber = q.pageNumber ?? 1;
    const offset = (pageNumber - 1) * pageSize;

    const myUser = userId && this.isUuid(userId) ? userId : null;

    const itemsQuery = `
      SELECT p.*,
             (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.status = 'Like') AS likes_count,
             (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.status = 'Dislike') AS dislikes_count,
             ${myUser ? `(
               SELECT status FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $${values.length + 3}
             )` : `'None'`} AS my_status,
             (SELECT JSON_AGG(
               JSON_BUILD_OBJECT(
                 'addedAt', likes_data.added_at,
                 'userId', likes_data.user_id,
                 'login', likes_data.login
               ) ORDER BY likes_data.added_at DESC
             ) FROM (
               SELECT pl.added_at, pl.user_id, u.login 
               FROM post_likes pl 
               JOIN users u ON u.id = pl.user_id 
               WHERE pl.post_id = p.id AND pl.status = 'Like' 
               ORDER BY pl.added_at DESC 
               LIMIT 3
             ) likes_data) AS newest_likes
      FROM posts p
      ${where}
      ORDER BY ${sortBy} ${sortDir}
      OFFSET $${values.length + 1}
      LIMIT $${values.length + 2}
    `;

    const countQuery = `SELECT COUNT(*)::int AS count FROM posts p ${where}`;

    const [itemsRows, countRows] = await Promise.all([
      this.postgres.query(itemsQuery, [...values, offset, pageSize, ...(myUser ? [myUser] : [])]),
      this.postgres.query(countQuery, values),
    ]);

    const totalCount = countRows[0]?.count ?? 0;

    return {
      items: itemsRows.map((r) => this.mapRow(r, userId)),
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }
}
