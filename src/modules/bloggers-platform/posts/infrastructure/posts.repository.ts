import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { LikeStatusDto, LikeStatusEnum } from '../dto/like-status.dto';
import { Types } from 'mongoose';
import { LikeStatus } from '../api/view-dto/extended-posts.view-dto';
import { UserViewDto } from '../../../users/api/view-dto/users.view-dto';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async save(post: PostDocument): Promise<void> {
    await post.save();
  }

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.PostModel.findById(id);
    if (!post) {
      throw new NotFoundException('post not found');
    }
    return post;
  }

  async findNonDeletedOrNotFoundFail(id: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('post not found');
    }
    const post = await this.PostModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });
    if (!post) {
      throw new NotFoundException('пост не найден');
    }
    return post;
  }
}
