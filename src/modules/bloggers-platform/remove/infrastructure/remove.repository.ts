import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog } from '../../blogs/domain/blog.entity';
import { Post } from '../../posts/domain/post.entity';
import { User } from '../../../users/domain/user.entity';

@Injectable()
export class RemoveRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: Model<Blog>,
    @InjectModel(Post.name)
    private PostModel: Model<Post>,
    @InjectModel(User.name)
    private UserModel: Model<User>,
  ) {}

  async removeAllData(): Promise<void> {
    await Promise.all([
      this.BlogModel.deleteMany({}),
      this.PostModel.deleteMany({}),
      this.UserModel.deleteMany({}),
    ]);
  }
}
