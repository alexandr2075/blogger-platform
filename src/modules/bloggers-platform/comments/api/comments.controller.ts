import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { LikeStatusDto } from '../dto/like-status.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CommentsService } from '../application/comments.service';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { JwtAuthGuardForUserId } from '../../../../core/guards/jwt-auth-for-user-id.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuardForUserId)
  async getCommentById(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.commentsService.findCommentById(id, userId);
  }

  @Put(':commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() userId: string,
  ) {
    await this.commentsService.updateComment(
      commentId,
      updateCommentDto,
      userId,
    );
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() userId: string,
  ) {
    await this.commentsService.deleteComment(commentId, userId);
  }

  @Put(':commentId/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async updateLikeStatus(
    @Param('commentId') commentId: string,
    @Body() likeStatusDto: LikeStatusDto,
    @CurrentUser() userId: string,
  ) {
    await this.commentsService.updateLikeStatus(
      commentId,
      likeStatusDto,
      userId,
    );
  }
}
