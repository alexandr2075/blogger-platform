import { CommentDocument } from '../domain/comment.entity';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class CommentatorInfo {
  userId: string;
  userLogin: string;
}

export class LikesInfo {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: Date;
  likesInfo?: LikesInfo;

  static mapToView(comment: CommentDocument, userId?: string): CommentViewDto {
    if (!comment || !comment._id) {
      throw new Error('Invalid comment document');
    }
    if (
      (userId && comment.likesCountArray?.includes(userId)) ||
      (userId && comment.dislikesCountArray?.includes(userId))
    ) {
      return {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: {
          userId: comment.userId,
          userLogin: comment.userLogin,
        },
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: comment.likesCountArray.length,
          dislikesCount: comment.dislikesCountArray.length,
          myStatus: comment.likesCountArray.includes(userId)
            ? LikeStatus.Like
            : comment.dislikesCountArray.includes(userId)
              ? LikeStatus.Dislike
              : LikeStatus.None,
        },
      };
    } else {
      return {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: {
          userId: comment.userId,
          userLogin: comment.userLogin,
          // userId: '',
          // userLogin: '',
        },
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: comment.likesCountArray.length,
          dislikesCount: comment.dislikesCountArray.length,
          myStatus: LikeStatus.None,
        },
      };
    }
  }
}
