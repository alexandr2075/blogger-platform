import { Comment } from '../domain/comment.entity';
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

  static mapToView(comment: Comment, userId?: string): CommentViewDto {
    if (!comment || !comment.id) {
      throw new Error('Invalid comment entity');
    }

    // Likes are stored separately in SQL now; we default to zeros/None here.
    // Upstream code can enrich likesInfo if needed.
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
      },
    };
  }
}
