import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { LikeStatusDto } from '../dto/like-status.dto';
import { CommentsRepository } from '../infrastructure/comments.repository';
import { CommentsQueryRepository } from '../infrastructure/comments.query-repository';
import { CommentViewDto } from '../dto/comments.view-dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async findCommentById(
    id: string,
    userId: string | undefined,
  ): Promise<CommentViewDto> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(id, userId);
  }

  async updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<void> {
    // Check if comment exists and user owns it
    const hasOwnership = await this.commentsRepository.checkOwnership(commentId, userId);
    if (!hasOwnership) {
      // Try to find comment to determine if it doesn't exist or user doesn't own it
      try {
        await this.commentsRepository.findOrNotFoundFail(commentId);
        throw new ForbiddenException('You do not have permission to edit this comment');
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new ForbiddenException('You do not have permission to edit this comment');
      }
    }

    await this.commentsRepository.update(commentId, {
      content: updateCommentDto.content,
    });
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Check if comment exists and user owns it
    const hasOwnership = await this.commentsRepository.checkOwnership(commentId, userId);
    if (!hasOwnership) {
      // Try to find comment to determine if it doesn't exist or user doesn't own it
      try {
        await this.commentsRepository.findOrNotFoundFail(commentId);
        throw new ForbiddenException('You do not have permission to delete this comment');
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new ForbiddenException('You do not have permission to delete this comment');
      }
    }

    await this.commentsRepository.softDelete(commentId);
  }

  async updateLikeStatus(
    commentId: string,
    likeStatusDto: LikeStatusDto,
    userId: string,
  ): Promise<void> {
    // Ensure comment exists before updating like status
    await this.commentsRepository.findOrNotFoundFail(commentId);
    
    await this.commentsRepository.upsertLike(
      commentId,
      userId,
      likeStatusDto.likeStatus as 'Like' | 'Dislike' | 'None',
    );
  }
}
