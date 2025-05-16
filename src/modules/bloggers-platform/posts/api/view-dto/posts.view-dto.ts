import { PostDocument } from '../../domain/post.entity';
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

  static mapToView(post: PostDocument, userId?: string, login?: string): PostViewDto {
    let myStatus = LikeStatus.None;
    
    if (userId) {
      if (post.likesCountArray.includes(userId)) myStatus = LikeStatus.Like;
      else if (post.dislikesCountArray.includes(userId)) myStatus = LikeStatus.Dislike;
    }

    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesCountArray.length,
        dislikesCount: post.dislikesCountArray.length,
        myStatus,
        newestLikes: post.extendedLikesInfo.newestLikes.slice(-3).reverse(),
      },
    };
  }
}
