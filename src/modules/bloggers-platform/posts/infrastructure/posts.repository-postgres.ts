import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from '../../../../core/database/postgres.config';

export interface CreatePostPgDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
}

export interface UpdatePostPgDto {
  title: string;
  shortDescription: string;
  content: string;
}

@Injectable()
export class PostsRepositoryPostgres {
  constructor(private readonly postgres: PostgresService) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const rows = await this.postgres.query(
      `SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('post not found');
    return rows[0];
  }

  async findNonDeletedOrNotFoundFail(id: string): Promise<any> {
    return this.findOrNotFoundFail(id);
  }

  async insert(dto: CreatePostPgDto): Promise<string> {
    const rows = await this.postgres.query(
      `INSERT INTO posts (title, short_description, content, blog_id, blog_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        dto.title,
        dto.shortDescription,
        dto.content,
        dto.blogId,
        dto.blogName,
      ],
    );
    return rows[0].id as string;
  }

  async update(id: string, dto: UpdatePostPgDto): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const rows = await this.postgres.query(
      `UPDATE posts
       SET title = $1, short_description = $2, content = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id`,
      [dto.title, dto.shortDescription, dto.content, id],
    );
    if (rows.length === 0) throw new NotFoundException('post not found');
  }

  async softDelete(id: string): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const rows = await this.postgres.query(
      `UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('post not found');
  }

  async upsertLike(postId: string, userId: string, status: 'Like'|'Dislike'|'None'): Promise<void> {
    if (!this.isUuid(postId)) throw new NotFoundException('post not found');
    await this.findOrNotFoundFail(postId);
    // If None -> delete row; else upsert
    if (status === 'None') {
      await this.postgres.query(
        `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId],
      );
      return;
    }
    await this.postgres.query(
      `INSERT INTO post_likes (post_id, user_id, status, added_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (post_id, user_id)
       DO UPDATE SET status = EXCLUDED.status, added_at = CURRENT_TIMESTAMP`,
      [postId, userId, status],
    );
  }
}
