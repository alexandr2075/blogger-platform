import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from '../../../../core/database/postgres.config';

export interface CreateCommentPgDto {
  content: string;
  userId: string;
  userLogin: string;
  postId: string;
}

export interface UpdateCommentPgDto {
  content: string;
}

@Injectable()
export class CommentsRepositoryPostgres {
  constructor(private readonly postgres: PostgresService) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    if (!this.isUuid(id)) throw new NotFoundException('comment not found');
    const rows = await this.postgres.query(
      `SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('comment not found');
    return rows[0];
  }

  async insert(dto: CreateCommentPgDto): Promise<string> {
    const rows = await this.postgres.query(
      `INSERT INTO comments (content, user_id, user_login, post_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [dto.content, dto.userId, dto.userLogin, dto.postId],
    );
    return rows[0].id as string;
  }

  async update(id: string, dto: UpdateCommentPgDto): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('comment not found');
    const rows = await this.postgres.query(
      `UPDATE comments
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [dto.content, id],
    );
    if (rows.length === 0) throw new NotFoundException('comment not found');
  }

  async softDelete(id: string): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('comment not found');
    const rows = await this.postgres.query(
      `UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('comment not found');
  }

  async upsertLike(commentId: string, userId: string, status: 'Like'|'Dislike'|'None'): Promise<void> {
    if (!this.isUuid(commentId)) throw new NotFoundException('comment not found');
    await this.findOrNotFoundFail(commentId);
    
    // If None -> delete row; else upsert
    if (status === 'None') {
      await this.postgres.query(
        `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
        [commentId, userId],
      );
      return;
    }
    
    await this.postgres.query(
      `INSERT INTO comment_likes (comment_id, user_id, status, added_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (comment_id, user_id)
       DO UPDATE SET status = EXCLUDED.status, added_at = CURRENT_TIMESTAMP`,
      [commentId, userId, status],
    );
  }

  async checkOwnership(commentId: string, userId: string): Promise<boolean> {
    if (!this.isUuid(commentId)) return false;
    const rows = await this.postgres.query(
      `SELECT id FROM comments WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [commentId, userId],
    );
    return rows.length > 0;
  }
}
