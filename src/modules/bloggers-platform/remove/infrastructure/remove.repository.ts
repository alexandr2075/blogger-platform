import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../users/domain/user.entity';
import { Blog } from '../../blogs/domain/blog.entity';
import { Comment } from '../../comments/domain/comment.entity';
import { Post } from '../../posts/domain/post.entity';
import { Device } from '@modules/devices/domain/device.entity';

@Injectable()
export class RemoveRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: Model<Blog>,
    @InjectModel(Post.name)
    private PostModel: Model<Post>,
    @InjectModel(User.name)
    private UserModel: Model<User>,
    @InjectModel(Comment.name)
    private CommentModel: Model<Comment>,
    @InjectModel(Device.name)
    private DeviceModel: Model<Device>,
  ) {}

  async removeAllData(): Promise<void> {
    await Promise.all([
      this.BlogModel.deleteMany({}),
      this.PostModel.deleteMany({}),
      this.UserModel.deleteMany({}),
      this.CommentModel.deleteMany({}),
      this.DeviceModel.deleteMany({}),
    ]);
  }
}
