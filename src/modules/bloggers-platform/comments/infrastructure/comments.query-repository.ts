import { Injectable, NotFoundException } from '@nestjs/common';
import { GetPostCommentsQueryParams, PostCommentsSortBy } from '../../posts/api/get-post-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto, LikeStatus } from '../dto/comments.view-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Comment } from '../domain/comment.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

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

    const qb = this.entityManager
      .createQueryBuilder(Comment, 'c')
      .select([
        'c.id AS id',
        'c.content AS content',
        'c.createdAt AS created_at',
        'c.userId AS user_id',
        'c.userLogin AS user_login',
      ])
      .addSelect(
        `(SELECT COUNT(*) FROM comment_likes cl WHERE cl."commentId" = c.id AND cl.status = 'Like')`,
        'likes_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM comment_likes cl WHERE cl."commentId" = c.id AND cl.status = 'Dislike')`,
        'dislikes_count',
      )
      .addSelect(
        myUser
          ? `(SELECT status FROM comment_likes cl WHERE cl."commentId" = c.id AND cl."userId" = :myUser)`
          : `'None'`,
        'my_status',
      )
      .where('c.id = :id', { id });

    const row = await qb.setParameters(myUser ? { myUser } : {}).getRawOne();
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

    const sortDir = q.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';
    const sortByKey = q.sortBy || PostCommentsSortBy.CreatedAt;
    const sortExpression = 'c.createdAt';

    const pageSize = q.pageSize ?? 10;
    const pageNumber = q.pageNumber ?? 1;
    const offset = (pageNumber - 1) * pageSize;

    const myUser = userId && this.isUuid(userId) ? userId : null;

    const itemsQb = this.entityManager
      .createQueryBuilder(Comment, 'c')
      .select([
        'c.id AS id',
        'c.content AS content',
        'c.createdAt AS created_at',
        'c.userId AS user_id',
        'c.userLogin AS user_login',
      ])
      .addSelect(
        `(SELECT COUNT(*) FROM comment_likes cl WHERE cl."commentId" = c.id AND cl.status = 'Like')`,
        'likes_count',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM comment_likes cl WHERE cl."commentId" = c.id AND cl.status = 'Dislike')`,
        'dislikes_count',
      )
      .addSelect(
        myUser
          ? `(SELECT status FROM comment_likes cl WHERE cl."commentId" = c.id AND cl."userId" = :myUser)`
          : `'None'`,
        'my_status',
      )
      .where('c.postId = :postId', { postId })
      .orderBy(sortExpression, sortDir as 'ASC' | 'DESC')
      .offset(offset)
      .limit(pageSize);

    const [rows, totalCount] = await Promise.all([
      itemsQb.setParameters(myUser ? { myUser } : {}).getRawMany(),
      this.entityManager
        .createQueryBuilder(Comment, 'c')
        .where('c.postId = :postId', { postId })
        .getCount(),
    ]);

    return {
      items: rows.map((r) => this.mapRow(r, userId)),
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }
}
