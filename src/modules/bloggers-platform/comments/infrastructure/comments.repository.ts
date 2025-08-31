import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Comment } from '../domain/comment.entity';

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
export class CommentsRepository {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  async findOrNotFoundFail(id: string): Promise<Comment> {
    try {
      const comment = await this.entityManager.findOne(Comment, {
        where: { id },
      });
      if (!comment) throw new NotFoundException('comment not found');
      return comment;
    } catch (error) {
      throw new NotFoundException('comment not found');
    }
  }

  async insert(dto: CreateCommentPgDto): Promise<string> {
    try {
      const comment = this.entityManager.create(Comment, {
        content: dto.content,
        userId: dto.userId,
        userLogin: dto.userLogin,
        postId: dto.postId,
      });
      const saved = await this.entityManager.save(comment);
      return saved.id;
    } catch (error) {
      console.error('Error inserting comment:', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCommentPgDto): Promise<void> {
    try {
      const result = await this.entityManager.update(Comment, { id }, { content: dto.content });
      if (!result.affected) throw new NotFoundException('comment not found');
    } catch (error) {
      throw new NotFoundException('comment not found');
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      const result = await this.entityManager.delete(Comment, { id });
      if (!result.affected) throw new NotFoundException('comment not found');
    } catch (error) {
      throw new NotFoundException('comment not found');
    }
  }

  async upsertLike(commentId: string, userId: string, status: 'Like'|'Dislike'|'None'): Promise<void> {
    await this.findOrNotFoundFail(commentId);
    
    // If None -> delete row; else upsert
    if (status === 'None') {
      await this.entityManager.query(
        `DELETE FROM comment_likes WHERE "commentId" = $1 AND "userId" = $2`,
        [commentId, userId],
      );
      return;
    }
    
    await this.entityManager.query(
      `INSERT INTO comment_likes ("commentId", "userId", status, "addedAt")
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT ("commentId", "userId")
       DO UPDATE SET status = EXCLUDED.status, "addedAt" = CURRENT_TIMESTAMP`,
      [commentId, userId, status],
    );
  }

  async checkOwnership(commentId: string, userId: string): Promise<boolean> {
    try {
      const comment = await this.entityManager.findOne(Comment, {
        where: { id: commentId, userId },
      });
      return !!comment;
    } catch (error) {
      return false;
    }
  }
}

