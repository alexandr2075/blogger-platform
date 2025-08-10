import { Injectable } from '@nestjs/common';
import { PostgresService } from '../../../../core/database/postgres.config';

@Injectable()
export class RemoveRepository {
  constructor(private postgres: PostgresService) {}

  async removeAllData(): Promise<void> {
    // Delete in order to respect foreign key constraints
    await this.postgres.query('DELETE FROM comment_likes', []);
    await this.postgres.query('DELETE FROM comments', []);
    await this.postgres.query('DELETE FROM post_likes', []);
    await this.postgres.query('DELETE FROM posts', []);
    await this.postgres.query('DELETE FROM blogs', []);
    await this.postgres.query('DELETE FROM devices', []);
    await this.postgres.query('DELETE FROM users', []);
  }
}
