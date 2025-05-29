import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { LikeStatusDto } from '../dto/like-status.dto';
import { CommentsRepository } from '../infrastructure/comments.repository';
import { Types } from 'mongoose';
import { CommentViewDto } from '../dto/comments.view-dto';

@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async findCommentById(
    id: string | Types.ObjectId,
    userId: string | undefined,
  ) {
    const commentId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('invalid comment id');
    }
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }
    return CommentViewDto.mapToView(comment, userId);
  }

  async updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ) {
    const comment = await this.commentsRepository.findById(
      new Types.ObjectId(commentId),
    );

    if (!comment) {
      throw new NotFoundException('Comment not exists');
    }

    if (comment && comment.userId !== userId) {
      throw new ForbiddenException(
        'У вас нет прав для редактирования этого комментария',
      );
    }

    await this.commentsRepository.update(commentId, updateCommentDto);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentsRepository.findById(
      new Types.ObjectId(commentId),
    );
    if (!comment) {
      throw new NotFoundException('Comment not exists ');
    }
    if (comment && comment.userId !== userId) {
      throw new ForbiddenException(
        'У вас нет прав для удаления этого комментария',
      );
    }

    await this.commentsRepository.delete(commentId);
  }

  async updateLikeStatus(
    commentId: string,
    likeStatusDto: LikeStatusDto,
    userId: string,
  ) {
    const commentObjectId = new Types.ObjectId(commentId);
    await this.findCommentById(commentObjectId, userId);
    await this.commentsRepository.updateLikeStatus(
      commentObjectId,
      likeStatusDto,
      userId,
    );
  }
}
