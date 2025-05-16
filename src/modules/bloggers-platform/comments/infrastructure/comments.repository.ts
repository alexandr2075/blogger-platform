import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { LikeStatusDto, LikeStatusEnum } from '../dto/like-status.dto';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<Comment>,
  ) {}

  async save(comment: CommentDocument): Promise<void> {
    await comment.save();
  }

  async findById(id: Types.ObjectId): Promise<CommentDocument | null> {
    return this.commentModel.findById(id);
  }

  async update(commentId: string, updateCommentDto: UpdateCommentDto): Promise<void> {
    await this.commentModel.findByIdAndUpdate(commentId, {
      content: updateCommentDto.content,
    });
  }

  async delete(commentId: string): Promise<void> {
    await this.commentModel.findByIdAndDelete(commentId);
  }

  async updateLikeStatus(commentId: Types.ObjectId, likeStatusDto: LikeStatusDto, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    const updateQuery: any = {};

    switch (likeStatusDto.likeStatus) {
      case LikeStatusEnum.Like:
        updateQuery.$addToSet = { likesCountArray: userId };
        updateQuery.$pull = { dislikesCountArray: userId };
        break;
      case LikeStatusEnum.Dislike:
        updateQuery.$addToSet = { dislikesCountArray: userId };
        updateQuery.$pull = { likesCountArray: userId };
        break;
      case LikeStatusEnum.None:
        updateQuery.$pull = {
          likesCountArray: userId,
          dislikesCountArray: userId
        };
        break;
    }

    if (Object.keys(updateQuery).length > 0) {
      await this.commentModel.updateOne({ _id: commentId }, updateQuery);
    }
  }
  }
