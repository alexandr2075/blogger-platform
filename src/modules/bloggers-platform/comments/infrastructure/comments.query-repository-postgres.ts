import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from '../../../../core/database/postgres.config';
import { GetPostCommentsQueryParams, PostCommentsSortBy } from '../../posts/api/get-post-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto, LikeStatus } from '../dto/comments.view-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';

@Injectable()
export class CommentsQueryRepositoryPostgres {
  constructor(private readonly postgres: PostgresService) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  private mapRow(row: any, userId?: string): CommentViewDto {
    const myStatus = row.my_status ?? 'None';
    return {
      id: row.id,
      content: row.content,
      commentatorInfo: {
        userId: row.user_id,
        userLogin: row.user_login,
      },
      createdAt: row.created_at,
      likesInfo: {
        likesCount: Number(row.likes_count) || 0,
        dislikesCount: Number(row.dislikes_count) || 0,
        myStatus: myStatus as LikeStatus,
      },
    };
  }

  async getByIdOrNotFoundFail(id: string, userId?: string): Promise<CommentViewDto> {
    if (!this.isUuid(id)) throw new NotFoundException('comment not found');
    const myUser = userId && this.isUuid(userId) ? userId : null;

    const row = (
      await this.postgres.query(
        `SELECT c.*,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.status = 'Like') AS likes_count,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.status = 'Dislike') AS dislikes_count,
                ${myUser ? `(
                  SELECT status FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2
                )` : `'None'`} AS my_status
         FROM comments c
         WHERE c.id = $1 AND c.deleted_at IS NULL`,
        myUser ? [id, myUser] : [id],
      )
    )[0];
    if (!row) throw new NotFoundException('comment not found');
    return this.mapRow(row, userId);
  }

  async getAllByPostId(
    postId: string,
    queryParams: GetPostCommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    if (!this.isUuid(postId)) throw new NotFoundException('post not found');
    
    const q = new GetPostCommentsQueryParams();
    Object.assign(q, queryParams);

    const filters: string[] = ['c.deleted_at IS NULL', 'c.post_id = $1'];
    const values: any[] = [postId];

    const sortDir = q.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';
    const sortByKey = q.sortBy || PostCommentsSortBy.CreatedAt;
    let sortExpression = 'c.created_at';
    if (sortByKey === PostCommentsSortBy.CreatedAt) {
      sortExpression = 'c.created_at';
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const pageSize = q.pageSize ?? 10;
    const pageNumber = q.pageNumber ?? 1;
    const offset = (pageNumber - 1) * pageSize;

    const myUser = userId && this.isUuid(userId) ? userId : null;

    const itemsQuery = `
      SELECT c.*,
             (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.status = 'Like') AS likes_count,
             (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.status = 'Dislike') AS dislikes_count,
             ${myUser ? `(
               SELECT status FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $${values.length + 3}
             )` : `'None'`} AS my_status
      FROM comments c
      ${where}
      ORDER BY ${sortExpression} ${sortDir}
      OFFSET $${values.length + 1}
      LIMIT $${values.length + 2}
    `;

    const countQuery = `SELECT COUNT(*)::int AS count FROM comments c ${where}`;

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
