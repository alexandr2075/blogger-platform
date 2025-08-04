import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Blog } from '../../blogs/domain/blog.entity';
// import { Comment } from '../../comments/domain/comment.entity';
// import { Post } from '../../posts/domain/post.entity';
import { UsersRepositoryPostgres } from '../../../users/infrastructure/users.repository-postgres';
import { DevicesRepositoryPostgres } from '../../../devices/infrastructure/devices.repository-postgres';

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
  ) {}

  async removeAllData(): Promise<void> {
    await Promise.all([
      // this.BlogModel.deleteMany({}),
      // this.PostModel.deleteMany({}),
      // this.CommentModel.deleteMany({}),
      // PostgreSQL repositories don't have deleteMany, so we'll implement custom methods
      this.usersRepository.deleteAll(),
      this.devicesRepository.deleteAll(),
    ]);
  }
}
