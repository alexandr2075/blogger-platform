import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Blog } from '../../blogs/domain/blog.entity';
// import { Comment } from '../../comments/domain/comment.entity';
// import { Post } from '../../posts/domain/post.entity';
import { UsersRepositoryPostgres } from '../../../users/infrastructure/users.repository-postgres';
import { DevicesRepositoryPostgres } from '../../../devices/infrastructure/devices.repository-postgres';
import { PostgresService } from '../../../../core/database/postgres.config';

@Injectable()
export class RemoveRepository {
  constructor(
    // @InjectModel(Blog.name)
    // private BlogModel: Model<Blog>,
    // @InjectModel(Post.name)
    // private PostModel: Model<Post>,
    // @InjectModel(Comment.name)
    // private CommentModel: Model<Comment>,
    private usersRepository: UsersRepositoryPostgres,
    private devicesRepository: DevicesRepositoryPostgres,
    private postgres: PostgresService,
  ) {}

  async removeAllData(): Promise<void> {
    // Clear relational data in correct order due to FK constraints
    await this.postgres.query('DELETE FROM post_likes', []);
    await this.postgres.query('DELETE FROM posts', []);
    await this.postgres.query('DELETE FROM blogs', []);
    await Promise.all([
      this.usersRepository.deleteAll(),
      this.devicesRepository.deleteAll(),
    ]);
  }
}
