import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { Types } from 'mongoose';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async findById(id: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('invalid post id');
    }
    const blog = await this.findById(id);

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    return blog;
  }

  async findNonDeletedOrNotFoundFail(id: string): Promise<BlogDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('invalid post id');
    }
    
    const blog = await this.findById(id);

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    return blog;
  }
}
