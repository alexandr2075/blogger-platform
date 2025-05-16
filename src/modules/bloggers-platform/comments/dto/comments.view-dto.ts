import { CommentDocument } from "../domain/comment.entity";

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

  static mapToView(comment: CommentDocument): CommentViewDto {
    if (!comment || !comment._id) {
      throw new Error('Invalid comment document');
    }
    
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
        myStatus: comment.likesCountArray.includes(comment.userId) ? LikeStatus.Like
          : comment.dislikesCountArray.includes(comment.userId) ? LikeStatus.Dislike
          : LikeStatus.None,
      },
    };
  }
}

