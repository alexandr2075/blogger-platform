import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Post } from '../../posts/domain/post.entity';
import { Like } from '../../posts/domain/like.entity';


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
export class PostsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const row = await this.entityManager
      .createQueryBuilder(Post, 'p')
      .where('p.id = :id', { id })
      .andWhere('p.deletedAt IS NULL')
      .getOne();
    if (!row) throw new NotFoundException('post not found');
    return row;
  }

  async findNonDeletedOrNotFoundFail(id: string): Promise<any> {
    return this.findOrNotFoundFail(id);
  }

  async insert(dto: CreatePostPgDto): Promise<string> {
    const insertResult = await this.entityManager
      .createQueryBuilder()
      .insert()
      .into(Post)
      .values({
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
        blogId: dto.blogId,
        blogName: dto.blogName,
      })
      .returning('id')
      .execute();
    return insertResult.identifiers[0].id as string;
  }

  async update(id: string, dto: UpdatePostPgDto): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const result = await this.entityManager
      .createQueryBuilder()
      .update(Post)
      .set({
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
        updatedAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('id = :id', { id })
      .andWhere('"deletedAt" IS NULL')
      .returning('id')
      .execute();
    if (!result.affected) throw new NotFoundException('post not found');
  }

  async softDelete(id: string): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('post not found');
    const result = await this.entityManager
      .createQueryBuilder()
      .update(Post)
      .set({ deletedAt: () => 'CURRENT_TIMESTAMP' })
      .where('id = :id', { id })
      .andWhere('"deletedAt" IS NULL')
      .execute();
    if (!result.affected) throw new NotFoundException('post not found');
  }

  async upsertLike(postId: string, userId: string, status: 'Like'|'Dislike'|'None'): Promise<void> {
    if (!this.isUuid(postId)) throw new NotFoundException('post not found');
    await this.findOrNotFoundFail(postId);
    // If None -> delete row; else upsert
    if (status === 'None') {
      await this.entityManager
        .createQueryBuilder()
        .delete()
        .from(Like)
        .where('postId = :postId AND userId = :userId', { postId, userId })
        .execute();
      return;
    }
    await this.entityManager
      .createQueryBuilder()
      .insert()
      .into(Like)
      .values({
        postId,
        userId,
        status: status as any,
        addedAt: () => 'CURRENT_TIMESTAMP',
      })
      .orUpdate(
        ['status', 'addedAt'],
        ['postId', 'userId']
      )
      .execute();
  }
}

