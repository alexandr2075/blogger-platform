import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog } from '../../blogs/domain/blog.entity';
import { Post } from '../../posts/domain/post.entity';

@Injectable()
export class RemoveRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: Model<Blog>,
    @InjectModel(Post.name)
    private PostModel: Model<Post>,
  ) {}

  async removeAllData(): Promise<void> {
    await Promise.all([
      this.BlogModel.deleteMany({}),
      this.PostModel.deleteMany({}),
    ]);
  }
} 