import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class RemoveRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async removeAllData(): Promise<void> {
    await this.entityManager.query(
      'TRUNCATE comment_likes, "comments", likes, posts, blogs, devices, users RESTART IDENTITY CASCADE',
    );
  }
}
