import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { GetPostsQueryParams, PostsSortBy } from '../api/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../api/view-dto/posts.view-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';
import { Post } from '../domain/post.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  private mapRow(row: any, userId?: string): PostViewDto {
    const myStatus = row.myStatus ?? 'None';
    let newestLikes: any[] = [];
    
    // Parse newest likes if they exist
    if (row.newestLikes && row.newestLikes !== null) {
      try {
        const parsed = typeof row.newestLikes === 'string' 
          ? JSON.parse(row.newestLikes) 
          : row.newestLikes;
        newestLikes = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        newestLikes = [];
      }
    }
    
    return {
      id: row.id,
      title: row.title,
      shortDescription: row.shortDescription,
      content: row.content,
      blogId: row.blogId,
      blogName: row.blogName,
      createdAt: row.createdAt,
      extendedLikesInfo: {
        likesCount: Number(row.likesCount) || 0,
        dislikesCount: Number(row.dislikesCount) || 0,
        myStatus: myStatus,
        newestLikes: newestLikes,
      },
    } as any;
  }

  async getByIdOrNotFoundFail(id: string, userId?: string): Promise<PostViewDto> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const myUser = userId && this.isUuid(userId) ? userId : null;
    const qb = this.entityManager
      .createQueryBuilder()
      .from(Post, 'p')
      .select([
        'p.id AS id',
        'p.title AS title',
        'p.shortDescription AS "shortDescription"',
        'p.content AS content',
        'p.blogId AS "blogId"',
        'p.blogName AS "blogName"',
        'p.createdAt AS "createdAt"',
      ])
      .addSelect(`(SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id AND l.status = 'Like')`, 'likesCount')
      .addSelect(`(SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id AND l.status = 'Dislike')`, 'dislikesCount')
      .addSelect(
        myUser
          ? `(SELECT status FROM likes l WHERE l."postId" = p.id AND l."userId" = :myUser)`
          : `'None'`,
        'myStatus',
      )
      .addSelect(
        `(SELECT JSON_AGG(JSON_BUILD_OBJECT('addedAt', likes_data."addedAt",'userId', likes_data."userId",'login', likes_data.login)
          ORDER BY likes_data."addedAt" DESC)
          FROM (
            SELECT l."addedAt", l."userId", u.login
            FROM likes l
            JOIN users u ON u.id = l."userId"
            WHERE l."postId" = p.id AND l.status = 'Like'
            ORDER BY l."addedAt" DESC
            LIMIT 3
          ) likes_data)`,
        'newestLikes',
      )
      .where('p.id = :id AND p.deletedAt IS NULL', { id });

    if (myUser) qb.setParameters({ myUser });

    const row = await qb.getRawOne();
    if (!row) throw new NotFoundException('post not found');
    return this.mapRow(row, userId || undefined);
  }

  async getAll(
    queryParams: GetPostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const q = new GetPostsQueryParams();
    Object.assign(q, queryParams);
    const sortMap: Record<string, string> = {
      [PostsSortBy.Title]: 'p.title',
      [PostsSortBy.ShortDescription]: 'p.shortDescription',
      [PostsSortBy.Content]: 'p.content',
      [PostsSortBy.BlogId]: 'p.blogId',
      [PostsSortBy.BlogName]: 'p.blogName',
      [PostsSortBy.CreatedAt]: 'p.createdAt',
    };
    const sortBy = sortMap[q.sortBy] || 'p.createdAt';
    const sortDir = q.sortDirection === SortDirection.Asc ? 'ASC' : 'DESC';

    const pageSize = q.pageSize ?? 10;
    const pageNumber = q.pageNumber ?? 1;
    const offset = (pageNumber - 1) * pageSize;

    const myUser = userId && this.isUuid(userId) ? userId : null;

    const baseQb = this.entityManager
      .createQueryBuilder()
      .from(Post, 'p')
      .select([
        'p.id AS id',
        'p.title AS title',
        'p.shortDescription AS "shortDescription"',
        'p.content AS content',
        'p.blogId AS "blogId"',
        'p.blogName AS "blogName"',
        'p.createdAt AS "createdAt"',
      ])
      .addSelect(`(SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id AND l.status = 'Like')`, 'likesCount')
      .addSelect(`(SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id AND l.status = 'Dislike')`, 'dislikesCount')
      .addSelect(
        myUser
          ? `(SELECT status FROM likes l WHERE l."postId" = p.id AND l."userId" = :myUser)`
          : `'None'`,
        'myStatus',
      )
      .addSelect(
        `(SELECT JSON_AGG(JSON_BUILD_OBJECT('addedAt', likes_data."addedAt",'userId', likes_data."userId",'login', likes_data.login)
          ORDER BY likes_data."addedAt" DESC)
          FROM (
            SELECT l."addedAt", l."userId", u.login
            FROM likes l
            JOIN users u ON u.id = l."userId"
            WHERE l."postId" = p.id AND l.status = 'Like'
            ORDER BY l."addedAt" DESC
            LIMIT 3
          ) likes_data)`,
        'newestLikes',
      )
      .where('p.deletedAt IS NULL');

    if (q.blogId) baseQb.andWhere('p.blogId = :blogId', { blogId: q.blogId });
    if (myUser) baseQb.setParameters({ myUser });

    const [rows, countRow] = await Promise.all([
      baseQb.clone().orderBy(sortBy, sortDir as 'ASC' | 'DESC').offset(offset).limit(pageSize).getRawMany(),
      this.entityManager
        .createQueryBuilder()
        .from(Post, 'p')
        .select('COUNT(*)', 'count')
        .where('p.deletedAt IS NULL')
        .andWhere(q.blogId ? 'p.blogId = :blogId' : '1=1', q.blogId ? { blogId: q.blogId } : {})
        .getRawOne(),
    ]);

    const totalCount = Number(countRow?.count || 0);

    return {
      items: rows.map((r) => this.mapRow(r, userId)),
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }
}
