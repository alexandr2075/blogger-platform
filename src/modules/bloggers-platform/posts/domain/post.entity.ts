import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreatePostInputDtoWithBlogName } from '../api/input-dto/posts.input-dto';
import { UpdatePostInputDto } from '../api/input-dto/update-post.input-dto';
import { ExtendedLikesInfo, LikeDetails, LikeStatus } from '../api/view-dto/extended-posts.view-dto';

@Schema({ timestamps: true, optimisticConcurrency: true, versionKey: '__v' })
export class Post {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  @Prop({ type: Date, nullable: true })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: ExtendedLikesInfo, default: {} })
  extendedLikesInfo: ExtendedLikesInfo;

  @Prop({ type: [String], default: [] })
  likesCountArray: string[];

  @Prop({ type: [String], default: [] })
  dislikesCountArray: string[];

  static createInstance(dto: CreatePostInputDtoWithBlogName): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.deletedAt = null;
    post.likesCountArray = [];
    post.dislikesCountArray = [];
    extendedLikesInfo: {
      likesCount: post.likesCountArray ? post.likesCountArray.length : null;
      dislikesCount: post.dislikesCountArray? post.dislikesCountArray.length : null;
      myStatus: LikeStatus.None;
      newestLikes:[];
    };
    return post as PostDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(dto: UpdatePostInputDto) {
    if (dto.title) this.title = dto.title;
    if (dto.shortDescription) this.shortDescription = dto.shortDescription;
    if (dto.content) this.content = dto.content;
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;
export type PostModelType = Model<PostDocument> & typeof Post;
