
import { Post } from '../../domain/post.entity';
import { LikeDetails, LikeStatus } from '../view-dto/extended-posts.view-dto';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: {
    likesCount: number | null;
    dislikesCount: number | null;
    myStatus: LikeStatus;
    newestLikes: LikeDetails[];
  };

  static mapToView(
    post: Post,
    userId?: string,
    login?: string,
  ): PostViewDto {
    // With TypeORM entity, like status/counts are computed in query layer.
    // Default here to safe values; callers can overwrite if needed.
    const myStatus = LikeStatus.None;
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: (post as any).blog?.name ?? '',
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus,
        newestLikes: [],
      },
    };
  }
}

